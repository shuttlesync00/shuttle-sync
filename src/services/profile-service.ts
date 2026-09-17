import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { findCanonicalPlayerByPhone, findOrCreateCanonicalPlayer } from "@/services/player-identity-service";
import type { SupabaseUserPayload } from "@/services/user-service";

export interface AuthenticatedProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  city: string | null;
  country: string | null;
  memberSince: string;
  playerId: string | null;
}

export interface UserMatchSummary {
  id: string;
  category: string | null;
  status: string;
  homeName: string | null;
  awayName: string | null;
  scoreHome: number;
  scoreAway: number;
  tournamentName: string | null;
  isTournament: boolean;
  userSide: "home" | "away" | null;
  userWon: boolean | null;
  playedAt: string;
}

function getAuthName(user: SupabaseUserPayload) {
  const name = user.user_metadata?.name?.trim();
  return name || null;
}

function getAuthPhone(user: SupabaseUserPayload) {
  const phone = user.user_metadata?.phoneNumber ?? user.user_metadata?.phone;
  return typeof phone === "string" && phone.trim() ? normalizePhoneNumber(phone) : null;
}

export async function getAuthenticatedProfile(user: SupabaseUserPayload): Promise<AuthenticatedProfile> {
  const authName = getAuthName(user);
  const authPhone = getAuthPhone(user);
  const authEmail = user.email ?? "";
  const authImage = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  if (!prisma) {
    return {
      id: user.id,
      name: authName ?? "",
      email: authEmail,
      phoneNumber: authPhone,
      profileImage: authImage,
      city: null,
      country: null,
      memberSince: user.created_at ?? new Date(0).toISOString(),
      playerId: null,
    };
  }

  const userSelect = { id: true, name: true, email: true, phoneNumber: true, profileImage: true, createdAt: true } as const;
  const existingUser = await prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
  const existingUserByEmail = !existingUser && authEmail
    ? await prisma.user.findUnique({ where: { email: authEmail }, select: userSelect })
    : null;
  const profileUser = existingUser ?? existingUserByEmail;
  const fallbackPhone = authPhone ?? (profileUser?.phoneNumber ? normalizePhoneNumber(profileUser.phoneNumber) : null);
  const usersWithPhone = fallbackPhone && !profileUser
    ? await prisma.user.findMany({ where: { phoneNumber: { not: null } }, select: userSelect, orderBy: { createdAt: "asc" } })
    : [];
  const existingUserByPhone = usersWithPhone.find((candidate) => normalizePhoneNumber(candidate.phoneNumber ?? "") === fallbackPhone) ?? null;
  const profile = profileUser ?? existingUserByPhone ?? await prisma.user.create({
    data: {
      id: user.id,
      name: authName ?? authEmail,
      email: authEmail,
      phoneNumber: fallbackPhone,
      profileImage: authImage,
      createdAt: user.created_at ? new Date(user.created_at) : undefined,
    },
  });

  if (profile.id === user.id) {
    await prisma.user.update({
      where: { id: profile.id },
      data: {
        name: authName ?? undefined,
        email: authEmail || undefined,
        phoneNumber: fallbackPhone ?? undefined,
        profileImage: authImage ?? undefined,
      },
    });
  }

  const matchedPlayer = fallbackPhone
    ? await findCanonicalPlayerByPhone(fallbackPhone) ?? await findOrCreateCanonicalPlayer({
      phoneNumber: fallbackPhone,
      createdById: profile.id,
      fullName: authName ?? profile.name,
      email: authEmail || profile.email,
    })
    : null;

  if (matchedPlayer && profile.phoneNumber !== matchedPlayer.normalizedPhone) {
    await prisma.user.update({ where: { id: profile.id }, data: { phoneNumber: matchedPlayer.normalizedPhone } });
  }

  console.info("[player-resolution] auth user -> mobile -> player", {
    authUserId: user.id,
    mobile: fallbackPhone,
    playerId: matchedPlayer?.id ?? null,
  });

  const resolvedName = authName ?? profile.name ?? authEmail?.split("@")[0] ?? "User";

  return {
    id: profile.id,
    name: resolvedName,
    email: authEmail || profile.email || "",
    phoneNumber: matchedPlayer?.normalizedPhone ?? matchedPlayer?.phoneNumber ?? fallbackPhone ?? profile.phoneNumber,
    profileImage: authImage ?? profile.profileImage,
    city: matchedPlayer?.city ?? null,
    country: matchedPlayer?.country ?? null,
    memberSince: profile.createdAt?.toISOString() ?? new Date(0).toISOString(),
    playerId: matchedPlayer?.id ?? null,
  };
}

export async function getAuthenticatedUserMatches(profile: AuthenticatedProfile): Promise<UserMatchSummary[]> {
  if (!prisma || !profile.playerId) {
    return [];
  }

  const matches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { playerAId: profile.playerId },
        { playerBId: profile.playerId },
        { homeTeam: { playerIds: { some: { playerId: profile.playerId } } } },
        { awayTeam: { playerIds: { some: { playerId: profile.playerId } } } },
      ],
    },
    select: {
      id: true,
      category: true,
      status: true,
      playerAId: true,
      playerBId: true,
      homeTeamId: true,
      awayTeamId: true,
      scoreHome: true,
      scoreAway: true,
      tournamentId: true,
      endedAt: true,
      createdAt: true,
      winnerTeamId: true,
      tournament: { select: { name: true } },
      playerA: { select: { fullName: true } },
      playerB: { select: { fullName: true } },
      homeTeam: { select: { id: true, name: true, playerIds: { select: { playerId: true } } } },
      awayTeam: { select: { id: true, name: true, playerIds: { select: { playerId: true } } } },
    },
    orderBy: [{ endedAt: "desc" }, { createdAt: "desc" }],
  });

  return matches.map((match) => {
    const isUserHome = match.playerAId === profile.playerId || match.homeTeam?.playerIds.some((teamPlayer) => teamPlayer.playerId === profile.playerId) === true;
    const isUserAway = match.playerBId === profile.playerId || match.awayTeam?.playerIds.some((teamPlayer) => teamPlayer.playerId === profile.playerId) === true;
    const userSide = isUserHome ? "home" : isUserAway ? "away" : null;
    const winningSide = match.winnerTeamId === match.homeTeamId || match.winnerTeamId === match.playerAId
      ? "home"
      : match.winnerTeamId === match.awayTeamId || match.winnerTeamId === match.playerBId
        ? "away"
        : null;
    const userWon = winningSide
      ? winningSide === userSide
      : userSide === "home"
        ? match.scoreHome > match.scoreAway
        : userSide === "away"
          ? match.scoreAway > match.scoreHome
          : null;

    return {
      id: match.id,
      category: match.category,
      status: match.status,
      homeName: match.playerA?.fullName ?? match.homeTeam?.name ?? null,
      awayName: match.playerB?.fullName ?? match.awayTeam?.name ?? null,
      scoreHome: match.scoreHome,
      scoreAway: match.scoreAway,
      tournamentName: match.tournament?.name ?? null,
      isTournament: Boolean(match.tournamentId),
      userSide,
      userWon,
      playedAt: (match.endedAt ?? match.createdAt).toISOString(),
    };
  });
}

export function summarizeUserMatches(matches: UserMatchSummary[]) {
  const wins = matches.filter((match) => match.userWon === true).length;
  const losses = matches.filter((match) => match.userWon === false).length;
  const matchesPlayed = wins + losses;

  return {
    matches: matchesPlayed,
    wins,
    losses,
    winPercentage: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
    titles: 0,
  };
}

export async function getPlayerTitles(playerId: string | null) {
  if (!prisma || !playerId) return 0;

  const standings = await prisma.tournamentStanding.findMany({
    where: { tournament: { status: "COMPLETED" } },
    select: { tournamentId: true, category: true, won: true, pointsDifference: true, team: { select: { playerIds: { select: { playerId: true } } } } },
    orderBy: [{ tournamentId: "asc" }, { category: "asc" }, { won: "desc" }, { pointsDifference: "desc" }],
  });
  const winners = new Set<string>();
  let group = "";
  for (const standing of standings) {
    const currentGroup = `${standing.tournamentId}:${standing.category}`;
    if (currentGroup === group) continue;
    group = currentGroup;
    if (standing.team.playerIds.some((player) => player.playerId === playerId)) winners.add(standing.tournamentId);
  }
  return winners.size;
}
