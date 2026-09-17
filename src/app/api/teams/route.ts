import { getUser } from "@/lib/supabase/server";
import { createPlayerAndAttachToTeam, createTeam, deleteTeam, listTeams } from "@/services/team-service";
import { getTournamentById } from "@/services/tournament-service";
import { ensurePrismaUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const url = new URL(request.url);
  const tournamentId = url.searchParams.get("tournamentId") ?? undefined;
  const owner = await ensurePrismaUser(user);
  const teams = await listTeams(owner.id, tournamentId);
  return NextResponse.json(teams, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const owner = await ensurePrismaUser(user);
    // If a tournamentId was provided, ensure it references an existing tournament
    // and that the authenticated user owns the tournament.
    // If the client explicitly provided a tournamentId, require it to be valid
    // and owned by the authenticated user. Do NOT silently accept falsy
    // tournament ids or fallback to null for tournament-scoped creation.
    const teamPayloadBase = payload ?? {};

    if (Object.prototype.hasOwnProperty.call(teamPayloadBase, "tournamentId")) {
      // DEBUG: log incoming payload to help trace client → server during tests
      try {
        // eslint-disable-next-line no-console
        console.debug("[teams-api] incoming payload:", JSON.stringify(teamPayloadBase));
      } catch {}
      const supplied = teamPayloadBase.tournamentId;
      if (!supplied || typeof supplied !== "string") {
        return NextResponse.json({ error: "tournamentId is required and must be a non-empty string when provided" }, { status: 400 });
      }

      const tournament = await getTournamentById(supplied);
      if (!tournament) {
        return NextResponse.json({ error: "Invalid tournamentId" }, { status: 400 });
      }
      if (tournament.createdById !== owner.id) {
        return NextResponse.json({ error: "Forbidden: you do not own the tournament" }, { status: 403 });
      }
      if (tournament.status === "COMPLETED") {
        return NextResponse.json({ error: "Cannot add teams to a completed tournament" }, { status: 400 });
      }

      // Use only the verified tournament id for creation
      const teamPayload = { ...teamPayloadBase, tournamentId: tournament.id };
      // DEBUG: log verified tournament id before creation
      try {
        // eslint-disable-next-line no-console
        console.debug("[teams-api] verifiedTournamentId:", tournament.id);
      } catch {}

      const team = await createTeam(teamPayload, owner.id);
      if (!team) {
        return NextResponse.json({ error: "Unable to create team." }, { status: 400 });
      }

      const playerPayloads = Array.isArray(payload?.players) ? payload.players : [];
      for (const playerPayload of playerPayloads) {
        await createPlayerAndAttachToTeam(playerPayload, owner.id, team.id);
      }

      try {
        // eslint-disable-next-line no-console
        console.debug("[teams-api] created team:", team.id, team.name, team.tournamentId);
      } catch {}

      return NextResponse.json(team, { status: 201 });
    }

    // No tournamentId supplied: treat as global team creation (allowed).
    const team = await createTeam(teamPayloadBase, owner.id);
    if (!team) {
      return NextResponse.json({ error: "Unable to create team." }, { status: 400 });
    }

    const playerPayloads = Array.isArray(payload?.players) ? payload.players : [];
    for (const playerPayload of playerPayloads) {
      await createPlayerAndAttachToTeam(playerPayload, owner.id, team.id);
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create team.";
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

  if (!id) {
    return NextResponse.json({ error: "Team id is required." }, { status: 400 });
  }

  try {
    await deleteTeam(id, user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete team.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
