import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { findOrCreateCanonicalPlayer } from "@/services/player-identity-service";
import type { PlayerDraft, PlayerRecord } from "@/types/player";
import type { TeamDraft, TeamRecord } from "@/types/team";

export async function listTeamPlayers(teamId: string): Promise<PlayerRecord[]> {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.teamPlayer.findMany({
    where: { teamId },
    include: { player: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.player.id,
    photoUrl: row.player.photoUrl ?? null,
    fullName: row.player.fullName,
    gender: row.player.gender as PlayerRecord["gender"],
    dateOfBirth: row.player.dateOfBirth.toISOString(),
    age: row.player.age,
    phoneNumber: row.player.phoneNumber ?? null,
    email: row.player.email ?? null,
    preferredHand: row.player.preferredHand as PlayerRecord["preferredHand"],
    playingLevel: row.player.playingLevel as PlayerRecord["playingLevel"],
    city: row.player.city,
    state: row.player.state,
    country: row.player.country,
    createdById: row.player.createdById,
    createdAt: row.player.createdAt.toISOString(),
    updatedAt: row.player.updatedAt.toISOString(),
  }));
}

export async function listTeamPlayersForTeams(teamIds: string[]) {
  if (!prisma || teamIds.length === 0) return new Map<string, PlayerRecord[]>();

  const rows = await prisma.teamPlayer.findMany({
    where: { teamId: { in: teamIds } },
    include: { player: true },
    orderBy: { createdAt: "desc" },
  });
  const playersByTeam = new Map<string, PlayerRecord[]>();

  for (const row of rows) {
    const players = playersByTeam.get(row.teamId) ?? [];
    players.push({
      id: row.player.id,
      photoUrl: row.player.photoUrl ?? null,
      fullName: row.player.fullName,
      gender: row.player.gender as PlayerRecord["gender"],
      dateOfBirth: row.player.dateOfBirth.toISOString(),
      age: row.player.age,
      phoneNumber: row.player.phoneNumber ?? null,
      email: row.player.email ?? null,
      preferredHand: row.player.preferredHand as PlayerRecord["preferredHand"],
      playingLevel: row.player.playingLevel as PlayerRecord["playingLevel"],
      city: row.player.city,
      state: row.player.state,
      country: row.player.country,
      createdById: row.player.createdById,
      createdAt: row.player.createdAt.toISOString(),
      updatedAt: row.player.updatedAt.toISOString(),
    });
    playersByTeam.set(row.teamId, players);
  }

  return playersByTeam;
}

export async function listTeams(ownerId?: string, tournamentId?: string): Promise<TeamRecord[]> {
  if (!prisma) {
    return [];
  }

  const where: { ownerId?: string; tournamentId?: string } = {};
  if (ownerId) {
    where.ownerId = ownerId;
  }
  if (tournamentId) {
    where.tournamentId = tournamentId;
  }

  const rows = await prisma.team.findMany({
    where,
    select: { id: true, name: true, logoUrl: true, category: true, tournamentId: true, createdById: true, createdAt: true, updatedAt: true, playerIds: { select: { playerId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((team) => ({
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl ?? null,
    category: team.category as TeamRecord["category"],
    playerIds: team.playerIds.map((entry) => entry.playerId),
    tournamentId: team.tournamentId ?? null,
    createdById: team.createdById,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  }));
}

export async function countTeams(ownerId?: string, tournamentId?: string) {
  if (!prisma) return 0;

  return prisma.team.count({
    where: {
      ...(ownerId ? { ownerId } : {}),
      ...(tournamentId ? { tournamentId } : {}),
    },
  });
}

export async function createTeam(data: TeamDraft, ownerId: string): Promise<TeamRecord | null> {
  if (!prisma) {
    return null;
  }

  const playerInputs = Array.isArray(data.playerIds) ? data.playerIds : [];
  const team = await prisma.team.create({
    data: {
      name: data.name,
      logoUrl: data.logoUrl || null,
      category: data.category,
      tournamentId: data.tournamentId || null,
      createdById: ownerId,
      ownerId,
      playerIds: {
        create: playerInputs.map((playerId) => ({ playerId })),
      },
    },
  });

  return {
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl ?? null,
    category: team.category as TeamRecord["category"],
    playerIds: playerInputs,
    tournamentId: team.tournamentId ?? null,
    createdById: ownerId,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export async function createPlayerAndAttachToTeam(data: PlayerDraft, ownerId: string, teamId: string) {
  if (!prisma) {
    return null;
  }

  const normalizedPhone = normalizePhoneNumber(data.phoneNumber ?? "");
  if (!normalizedPhone) throw new Error("A valid mobile number is required.");
  const player = await findOrCreateCanonicalPlayer({
    phoneNumber: normalizedPhone,
    createdById: ownerId,
    fullName: data.fullName,
    email: data.email || null,
    city: data.city,
    country: data.country,
  });

  await prisma.teamPlayer.upsert({
    where: { teamId_playerId: { teamId, playerId: player.id } },
    create: { teamId, playerId: player.id },
    update: {},
  });

  return player;
}

export async function deleteTeam(id: string, ownerId: string) {
  if (!prisma) {
    return null;
  }

  return prisma.team.deleteMany({ where: { id, ownerId } });
}

export async function getTeamById(id: string): Promise<TeamRecord | null> {
  if (!prisma) {
    return null;
  }

  const team = await prisma.team.findUnique({ where: { id }, include: { playerIds: true } });
  if (!team) {
    return null;
  }

  return {
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl ?? null,
    category: team.category as TeamRecord["category"],
    playerIds: team.playerIds.map((entry) => entry.playerId),
    tournamentId: team.tournamentId ?? null,
    createdById: team.createdById,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}
