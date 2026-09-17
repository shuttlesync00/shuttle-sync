import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { validateTeamRoster } from "@/lib/roster";
import { getTeamById, listTeamPlayers } from "@/services/team-service";
import { getTournamentById } from "@/services/tournament-service";
import type { MatchRecord } from "@/types/match";
import type { Prisma } from "@prisma/client";

export async function listMatches(ownerId?: string, tournamentId?: string) {
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

  return prisma.match.findMany({
    where,
    select: {
      id: true,
      tournamentId: true,
      category: true,
      status: true,
      scoreHome: true,
      scoreAway: true,
      matchNumber: true,
      startedAt: true,
      endedAt: true,
      updatedAt: true,
      createdAt: true,
      homeTeamId: true,
      awayTeamId: true,
      playerAId: true,
      playerBId: true,
    },
  });
}

export async function countMatches(ownerId?: string, tournamentId?: string) {
  if (!prisma) return 0;

  return prisma.match.count({
    where: {
      ...(ownerId ? { ownerId } : {}),
      ...(tournamentId ? { tournamentId } : {}),
    },
  });
}

export async function listOneOffMatches(ownerId: string, playerId?: string | null) {
  if (!prisma) {
    return [];
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { ownerId },
        ...(playerId ? [
          { playerAId: playerId },
          { playerBId: playerId },
          { homeTeam: { playerIds: { some: { playerId } } } },
          { awayTeam: { playerIds: { some: { playerId } } } },
        ] : []),
      ],
    },
    include: { tournament: true, playerA: true, playerB: true, homeTeam: true, awayTeam: true },
    orderBy: { createdAt: "desc" },
  });

  return matches.map((match) => ({
    id: match.id,
    category: match.category,
    status: match.status === "LIVE" ? "IN_PROGRESS" : match.status,
    tournamentName: match.tournament?.name ?? null,
    matchNumber: match.matchNumber,
    bestOf: match.bestOf,
    scoreHome: match.scoreHome,
    scoreAway: match.scoreAway,
    homeName: match.playerA?.fullName ?? match.homeTeam?.name ?? "Player A",
    awayName: match.playerB?.fullName ?? match.awayTeam?.name ?? "Player B",
    court: match.court,
    startedAt: match.startedAt?.toISOString() ?? null,
    createdAt: match.createdAt.toISOString(),
  }));
}

export async function listMatchesForPlayerPhone(phoneNumber: string) {
  if (!prisma) {
    return [];
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) return [];

  const players = await prisma.player.findMany({
    where: { phoneNumber: { not: null } },
    select: { id: true, phoneNumber: true, normalizedPhone: true },
  });
  const playerIds = players.filter((player) => player.normalizedPhone === normalizedPhone || normalizePhoneNumber(player.phoneNumber ?? "") === normalizedPhone).map((player) => player.id);
  if (playerIds.length === 0) return [];

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { playerAId: { in: playerIds } },
        { playerBId: { in: playerIds } },
        { homeTeam: { playerIds: { some: { playerId: { in: playerIds } } } } },
        { awayTeam: { playerIds: { some: { playerId: { in: playerIds } } } } },
      ],
    },
    include: { tournament: true, playerA: true, playerB: true, homeTeam: true, awayTeam: true },
    orderBy: { createdAt: "desc" },
  });

  return matches.map((match) => ({
    id: match.id,
    category: match.category,
    status: match.status === "LIVE" ? "IN_PROGRESS" : match.status,
    scoreHome: match.scoreHome,
    scoreAway: match.scoreAway,
    homeName: match.playerA?.fullName ?? match.homeTeam?.name ?? "Team A",
    awayName: match.playerB?.fullName ?? match.awayTeam?.name ?? "Team B",
    tournamentName: match.tournament?.name ?? "One-off match",
    bestOf: match.bestOf,
    createdAt: match.createdAt.toISOString(),
  }));
}

function parseScheduledAt(time?: string) {
  if (!time) {
    return new Date();
  }

  const [hours, minutes] = time.split(":").map((value) => Number(value));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return new Date();
  }

  const scheduledAt = new Date();
  scheduledAt.setHours(hours, minutes, 0, 0);
  return scheduledAt;
}

export interface DashboardMatchSummary {
  id: string;
  category: string | null;
  status: string;
  homeName: string;
  awayName: string;
  scoreHome: number;
  scoreAway: number;
  playedAt: string;
}

export async function listRecentMatchesForDashboard(ownerId: string, limit = 5): Promise<DashboardMatchSummary[]> {
  if (!prisma) return [];

  const matches = await prisma.match.findMany({
    where: { ownerId },
    select: {
      id: true,
      category: true,
      status: true,
      scoreHome: true,
      scoreAway: true,
      endedAt: true,
      updatedAt: true,
      createdAt: true,
      playerA: { select: { fullName: true } },
      playerB: { select: { fullName: true } },
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: [{ endedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return matches.map((match) => ({
    id: match.id,
    category: match.category,
    status: match.status === "LIVE" ? "IN_PROGRESS" : match.status,
    homeName: match.playerA?.fullName ?? match.homeTeam?.name ?? "Home side",
    awayName: match.playerB?.fullName ?? match.awayTeam?.name ?? "Away side",
    scoreHome: match.scoreHome,
    scoreAway: match.scoreAway,
    playedAt: (match.endedAt ?? match.updatedAt ?? match.createdAt).toISOString(),
  }));
}

export async function createManualMatch(ownerId: string, tournamentId: string | null, teamAId: string, teamBId: string, court?: string, time?: string, bestOf = 3, category = "DOUBLES", playerAId?: string, playerBId?: string, gamePointTarget = 21): Promise<MatchRecord> {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const normalizedGamePointTarget = [11, 21].includes(Number(gamePointTarget)) ? Number(gamePointTarget) : 21;
  const normalizedTournamentId = tournamentId?.trim() || null;
  const tournament = normalizedTournamentId ? await getTournamentById(normalizedTournamentId) : null;
  if (normalizedTournamentId && !tournament) {
    throw new Error("Tournament not found.");
  }

  if (tournament && tournament.createdById !== ownerId) {
    throw new Error("Unauthorized to manage this tournament.");
  }

  if (tournament?.status === "COMPLETED") {
    throw new Error("Cannot start a match for a completed tournament.");
  }

  if (category === "SINGLES" && (!playerAId || !playerBId || playerAId === playerBId)) throw new Error("Select two different registered players.");
  if (category !== "SINGLES" && teamAId === teamBId) {
    throw new Error("Team A and Team B must be different.");
  }

  const [teamA, teamB] = await Promise.all([category === "SINGLES" ? null : getTeamById(teamAId), category === "SINGLES" ? null : getTeamById(teamBId)]);
  if (category !== "SINGLES" && (!teamA || !teamB)) {
    throw new Error("Both teams must exist.");
  }

  if (category !== "SINGLES" && normalizedTournamentId && (teamA?.tournamentId !== normalizedTournamentId || teamB?.tournamentId !== normalizedTournamentId)) {
    throw new Error("Selected teams must belong to the selected tournament.");
  }

  if (category !== "SINGLES" && teamA && teamB && teamA.category !== teamB.category) {
    throw new Error("Selected teams must be in the same category.");
  }

  const isSingles = category === "SINGLES";
  const existingMatch = await prisma.match.findFirst({
    where: {
      tournamentId: normalizedTournamentId,
      ...(isSingles
        ? { playerAId, playerBId }
        : { homeTeamId: teamAId, awayTeamId: teamBId }),
      status: { not: "COMPLETED" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingMatch) {
    throw new Error("An active match already exists for these teams.");
  }

  const rosterA = category === "SINGLES" ? null : validateTeamRoster({ category: teamA!.category }, await listTeamPlayers(teamA!.id));
  const rosterB = category === "SINGLES" ? null : validateTeamRoster({ category: teamB!.category }, await listTeamPlayers(teamB!.id));

  if (rosterA && rosterB && (rosterA.status !== "READY" || rosterB.status !== "READY")) {
    const messages = [] as string[];
    if (rosterA.status !== "READY") messages.push(`Team A: ${rosterA.message}`);
    if (rosterB.status !== "READY") messages.push(`Team B: ${rosterB.message}`);
    throw new Error(`Cannot start manual match. ${messages.join(" ")}`);
  }

  const highestMatch = await prisma.match.findFirst({
    where: { tournamentId: tournamentId ?? null },
    orderBy: { matchNumber: "desc" },
  });

  const matchNumber = highestMatch ? (highestMatch.matchNumber ?? 0) + 1 : 1;

  const match = await prisma.match.create({
    data: {
      ownerId,
      tournamentId: normalizedTournamentId,
      category,
      playerAId: playerAId ?? null,
      playerBId: playerBId ?? null,
      court: court ?? null,
      matchNumber,
      homeTeamId: isSingles ? null : teamAId,
      awayTeamId: isSingles ? null : teamBId,
      status: "IN_PROGRESS",
      scheduledAt: parseScheduledAt(time),
      startedAt: new Date(),
      bestOf,
      gamePointTarget: normalizedGamePointTarget,
      currentGame: 1,
      scoreHome: 0,
      scoreAway: 0,
      gameScores: [] as Prisma.InputJsonValue,
    },
  });

  return {
    id: match.id,
    status: match.status as MatchRecord["status"],
    tournamentId: match.tournamentId,
    tournamentName: null,
    category: match.category,
    court: match.court ?? null,
    matchNumber: match.matchNumber ?? null,
    bestOf: match.bestOf,
    gamePointTarget: match.gamePointTarget ?? 21,
    currentGame: match.currentGame,
    scoreHome: match.scoreHome,
    scoreAway: match.scoreAway,
    gameScores: [],
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    playerAId: match.playerAId,
    playerBId: match.playerBId,
    homeTeamName: null,
    awayTeamName: null,
    winnerTeamId: match.winnerTeamId ?? null,
    startedAt: match.startedAt?.toISOString() ?? null,
    endedAt: match.endedAt?.toISOString() ?? null,
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  };
}

export async function deleteMatch(id: string) {
  if (!prisma) {
    return null;
  }

  return prisma.match.delete({ where: { id } });
}
