import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { createFixture, deleteFixture, generateFixturesForTournament, getFixtureById, listFixturesForTournament, startFixtureMatch, updateFixture } from "@/services/fixture-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fixtureId = url.searchParams.get("fixtureId");
  const tournamentId = url.searchParams.get("tournamentId");
  const date = url.searchParams.get("date");

  if (fixtureId) {
    const fixture = await getFixtureById(fixtureId);
    return NextResponse.json(fixture, { status: 200 });
  }

  if (!tournamentId) {
    if (!prisma) {
      return NextResponse.json([], { status: 200 });
    }
    if (date) {
      const parsed = new Date(date);
      const rows = await prisma.fixture.findMany({ where: { date: parsed }, orderBy: [{ round: "asc" }, { matchNumber: "asc" }] });

      const fixtures = rows.map((row) => ({
        id: row.id,
        tournamentId: row.tournamentId,
        category: row.category,
        bestOf: row.bestOf,
        teamAId: row.teamAId,
        teamBId: row.teamBId,
        court: row.court ?? null,
        round: row.round ?? null,
        matchNumber: row.matchNumber,
        date: row.date.toISOString().slice(0, 10),
        time: row.time,
        status: row.status,
        notes: row.notes ?? null,
        createdById: row.createdById,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

      return NextResponse.json(fixtures, { status: 200 });
    }

    return NextResponse.json([], { status: 200 });
  }

  const fixtures = await listFixturesForTournament(tournamentId);
  return NextResponse.json(fixtures, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const payload = await request.json();

    if (payload.action === "VALIDATE") {
      if (!payload.tournamentId) {
        return NextResponse.json({ error: "Tournament id is required." }, { status: 400 });
      }

      const { readyTeamCount, invalidTeams } = await import("@/services/fixture-service").then((module) => module.validateFixtureGenerationEligibility(payload.tournamentId));
      return NextResponse.json({ readyTeamCount, invalidTeams }, { status: 200 });
    }

    if (payload.action === "GENERATE") {
      if (!payload.tournamentId) {
        return NextResponse.json({ error: "Tournament id is required." }, { status: 400 });
      }

      const fixtures = await generateFixturesForTournament(payload.tournamentId, user.id, payload.format ?? "ROUND_ROBIN", { replaceExisting: true });
      return NextResponse.json(fixtures, { status: 201 });
    }

    if (payload.action === "PREVIEW") {
      if (!payload.tournamentId) {
        return NextResponse.json({ error: "Tournament id is required." }, { status: 400 });
      }

      if (!prisma) return NextResponse.json({ generated: [], totalMatches: 0, totalRounds: 0 }, { status: 200 });

      const teams = await prisma.team.findMany({ where: { tournamentId: payload.tournamentId }, orderBy: { createdAt: "asc" } });
      if (teams.length < 2) {
        return NextResponse.json({ generated: [], totalMatches: 0, totalRounds: 0 }, { status: 200 });
      }

      const { readyTeamCount, invalidTeams } = await import("@/services/fixture-service").then((m) => m.validateFixtureGenerationEligibility(payload.tournamentId));
      if (invalidTeams.length > 0) {
        return NextResponse.json({ readyTeamCount, invalidTeams }, { status: 400 });
      }

      const generated = await import("@/services/fixture-generator").then((m) => m.generateFixtures({
        tournament: { id: payload.tournamentId, name: "Tournament" },
        teams: teams.map((t) => ({ id: t.id, name: t.name, category: t.category as "SINGLES" | "DOUBLES" | "MIXED_DOUBLES" })),
        format: payload.format ?? "ROUND_ROBIN",
      }));

      const totalRounds = generated.length > 0 ? Math.max(...(generated as unknown[]).map((f) => (f as { round?: number }).round ?? 0)) : 0;
      return NextResponse.json({ generated, totalMatches: generated.length, totalRounds }, { status: 200 });
    }

    if (payload.action === "START") {
      if (!payload.fixtureId) {
        return NextResponse.json({ error: "Fixture id is required." }, { status: 400 });
      }

      try {
        const match = await startFixtureMatch(payload.fixtureId, user.id);
        if (!match) {
          return NextResponse.json({ error: "Fixture not found." }, { status: 404 });
        }

        return NextResponse.json({ match }, { status: 200 });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to start match.";
        const status = message.includes("Unauthorized") ? 403 : 400;
        return NextResponse.json({ error: message }, { status });
      }
    }

    const fixture = await createFixture(payload.tournamentId, user.id, payload);
    return NextResponse.json(fixture, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create fixture.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const fixture = await updateFixture(payload.id, payload);

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found." }, { status: 404 });
    }

    return NextResponse.json(fixture, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update fixture.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const tournamentId = url.searchParams.get("tournamentId");

  if (!id && !tournamentId) {
    return NextResponse.json({ error: "Fixture id is required." }, { status: 400 });
  }

  try {
    if (tournamentId) {
      const fixtures = await listFixturesForTournament(tournamentId);
      await Promise.all(fixtures.map((fixture) => deleteFixture(fixture.id)));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await deleteFixture(id as string);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete fixture.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
