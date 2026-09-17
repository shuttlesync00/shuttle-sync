import { prisma } from "@/lib/prisma";
import { validateTeamRoster } from "@/lib/roster";
import { generateFixtures } from "@/services/fixture-generator";
import { listTeamPlayers } from "@/services/team-service";
import type { FixtureDraft, FixtureRecord } from "@/types/fixture";
import { Prisma } from "@prisma/client";

export async function validateFixtureGenerationEligibility(tournamentId: string): Promise<{ readyTeamCount: number; invalidTeams: Array<{ name: string; message: string }> }> {
  if (!prisma) {
    return { readyTeamCount: 0, invalidTeams: [] };
  }

  const teams = await prisma.team.findMany({ where: { tournamentId }, orderBy: { createdAt: "asc" } });
  const invalidTeams = [] as Array<{ name: string; message: string }>;
  let readyTeamCount = 0;

  for (const team of teams) {
    const players = await listTeamPlayers(team.id);
    const validation = validateTeamRoster({ category: team.category as FixtureRecord["category"] }, players);
    if (validation.status === "READY") {
      readyTeamCount += 1;
      continue;
    }

    invalidTeams.push({ name: team.name, message: validation.message });
  }

  return { readyTeamCount, invalidTeams };
}

export async function listFixturesForTournament(tournamentId: string): Promise<FixtureRecord[]> {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.fixture.findMany({
    where: { tournamentId },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    tournamentId: row.tournamentId,
    category: row.category as FixtureRecord["category"],
    bestOf: row.bestOf,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    court: row.court ?? null,
    round: row.round ?? null,
    matchNumber: row.matchNumber,
    date: row.date.toISOString().slice(0, 10),
    time: row.time,
    status: row.status as FixtureRecord["status"],
    notes: row.notes ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createFixture(tournamentId: string, ownerId: string, data: FixtureDraft): Promise<FixtureRecord> {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new Error("Tournament not found.");
  }
  if (tournament.status === "COMPLETED") {
    throw new Error("Cannot create fixture for a completed tournament.");
  }

  const highestMatch = await prisma.fixture.findFirst({
    where: { tournamentId },
    orderBy: { matchNumber: "desc" },
  });

  const matchNumber = highestMatch ? highestMatch.matchNumber + 1 : 1;
  const isSingles = data.category === "SINGLES";

  const row = await prisma.fixture.create({
    data: {
      tournamentId,
      category: data.category,
      bestOf: data.bestOf,
      teamAId: isSingles ? null : data.teamAId,
      teamBId: isSingles ? null : data.teamBId,
      playerAId: data.playerAId || null,
      playerBId: data.playerBId || null,
      court: data.court || null,
      matchNumber,
      round: data.round ?? null,
      date: new Date(data.date),
      time: data.time,
      status: "SCHEDULED",
      notes: data.notes || null,
      createdById: ownerId,
    },
  });

  return {
    id: row.id,
    tournamentId: row.tournamentId,
    category: row.category as FixtureRecord["category"],
    bestOf: row.bestOf,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    court: row.court ?? null,
    round: row.round ?? null,
    matchNumber: row.matchNumber,
    date: row.date.toISOString().slice(0, 10),
    time: row.time,
    status: row.status as FixtureRecord["status"],
    notes: row.notes ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateFixture(id: string, data: Partial<FixtureDraft>): Promise<FixtureRecord | null> {
  if (!prisma) {
    return null;
  }

  const isSingles = data.category === "SINGLES";
  const row = await prisma.fixture.update({
    where: { id },
    data: {
      category: data.category,
      teamAId: isSingles ? null : data.teamAId || null,
      teamBId: isSingles ? null : data.teamBId || null,
      playerAId: data.playerAId || null,
      playerBId: data.playerBId || null,
      court: data.court || null,
      date: data.date ? new Date(data.date) : undefined,
      time: data.time,
      notes: data.notes || null,
    },
  });

  return {
    id: row.id,
    tournamentId: row.tournamentId,
    category: row.category as FixtureRecord["category"],
    bestOf: row.bestOf,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    court: row.court ?? null,
    round: row.round ?? null,
    matchNumber: row.matchNumber,
    date: row.date.toISOString().slice(0, 10),
    time: row.time,
    status: row.status as FixtureRecord["status"],
    notes: row.notes ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteFixture(id: string) {
  if (!prisma) {
    return null;
  }

  return prisma.fixture.delete({ where: { id } });
}

export async function startFixtureMatch(fixtureId: string, ownerId: string) {
  if (!prisma) {
    return null;
  }

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
  if (!fixture) {
    return null;
  }

  // verify ownership: tournament owner must match ownerId
  const tournament = await prisma.tournament.findUnique({ where: { id: fixture.tournamentId } });
  if (!tournament || tournament.ownerId !== ownerId) {
    throw new Error("Unauthorized to start this match.");
  }

  if (tournament.status === "COMPLETED") {
    throw new Error("Cannot start a match for a completed tournament.");
  }

  // Only allow starting scheduled fixtures
  if (fixture.status !== "SCHEDULED") {
    throw new Error("Fixture cannot be started; only scheduled fixtures can be started.");
  }

  const existing = await prisma.match.findFirst({
    where: {
      tournamentId: fixture.tournamentId,
      homeTeamId: fixture.teamAId,
      awayTeamId: fixture.teamBId,
      matchNumber: fixture.matchNumber,
      status: { not: "COMPLETED" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    if (existing.status === "LIVE") {
      await prisma.match.update({ where: { id: existing.id }, data: { status: "IN_PROGRESS" } });
      existing.status = "IN_PROGRESS";
    }
    await prisma.fixture.update({ where: { id: fixtureId }, data: { status: "LIVE" } });
    return existing;
  }

  const gameScores = [] as Prisma.InputJsonValue;
  const match = await prisma.match.create({
    data: {
      ownerId,
      tournamentId: fixture.tournamentId,
      category: fixture.category,
      court: fixture.court ?? null,
      matchNumber: fixture.matchNumber,
      homeTeamId: fixture.teamAId,
      awayTeamId: fixture.teamBId,
      status: "IN_PROGRESS",
      scheduledAt: new Date(),
      startedAt: new Date(),
      bestOf: fixture.bestOf,
      currentGame: 1,
      scoreHome: 0,
      scoreAway: 0,
      gameScores,
    },
  });

  await prisma.fixture.update({ where: { id: fixtureId }, data: { status: "LIVE" } });
  return match;
}

export async function getFixtureById(id: string): Promise<FixtureRecord | null> {
  if (!prisma) {
    return null;
  }

  const row = await prisma.fixture.findUnique({ where: { id } });
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    tournamentId: row.tournamentId,
    category: row.category as FixtureRecord["category"],
    bestOf: row.bestOf,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    court: row.court ?? null,
    round: row.round ?? null,
    matchNumber: row.matchNumber,
    date: row.date.toISOString().slice(0, 10),
    time: row.time,
    status: row.status as FixtureRecord["status"],
    notes: row.notes ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function generateFixturesForTournament(tournamentId: string, ownerId: string, format: string, options?: { replaceExisting?: boolean }): Promise<FixtureRecord[]> {
  if (!prisma) {
    return [];
  }

  const teams = await prisma.team.findMany({ where: { tournamentId }, orderBy: { createdAt: "asc" } });
  if (teams.length < 2) {
    return [];
  }

  const validation = await validateFixtureGenerationEligibility(tournamentId);
  const invalidTeams = validation.invalidTeams;

  if (invalidTeams.length > 0) {
    const details = invalidTeams.map((team) => `• ${team.name}: ${team.message}`).join("\n");
    throw new Error(`Cannot generate fixtures. The following teams have incomplete rosters:\n${details}`);
  }

  if (options?.replaceExisting) {
    await prisma.fixture.deleteMany({ where: { tournamentId } });
  }

  const existing = await prisma.fixture.findMany({ where: { tournamentId } });
  if (existing.length > 0 && !options?.replaceExisting) {
    return existing.map((row) => ({
      id: row.id,
      tournamentId: row.tournamentId,
      category: row.category as FixtureRecord["category"],
      bestOf: row.bestOf,
      teamAId: row.teamAId,
      teamBId: row.teamBId,
      court: row.court ?? null,
      round: row.round ?? null,
      matchNumber: row.matchNumber,
      date: row.date.toISOString().slice(0, 10),
      time: row.time,
      status: row.status as FixtureRecord["status"],
      notes: row.notes ?? null,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  const generatedFixtures = generateFixtures({
    tournament: { id: tournamentId, name: "Tournament" },
    teams: teams.map((team) => ({ id: team.id, name: team.name, category: team.category as FixtureRecord["category"] })),
    format: format === "ROUND_ROBIN" ? "ROUND_ROBIN" : "ROUND_ROBIN",
  });

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const time = "09:00";

  const createdFixtures: FixtureRecord[] = [];
  for (const [index, fixture] of generatedFixtures.entries()) {
    const createdFixture = await createFixture(tournamentId, ownerId, {
      category: teams.find((team) => team.id === fixture.teamAId)?.category as FixtureRecord["category"],
      teamAId: fixture.teamAId,
      teamBId: fixture.teamBId,
      court: undefined,
      round: fixture.round,
      date,
      time,
      notes: undefined,
      bestOf: (await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { bestOf: true } }))?.bestOf ?? 3,
    });
    createdFixtures.push({ ...createdFixture, round: fixture.round, matchNumber: index + 1 });
  }

  return createdFixtures;
}
