import { getUser } from "@/lib/supabase/server";
import { createManualMatch, listMatches } from "@/services/match-service";
import { ensurePrismaUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get("tournamentId") ?? undefined;
  const ownerId = url.searchParams.get("ownerId") ?? undefined;

  if (!tournamentId && !ownerId) {
    return NextResponse.json({ message: "Matches route scaffolded" }, { status: 200 });
  }

  const matches = await listMatches(ownerId, tournamentId);
  return NextResponse.json(matches, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const owner = await ensurePrismaUser(user);
    const tournamentId = typeof payload.tournamentId === "string" && payload.tournamentId.trim() ? payload.tournamentId : null;
    const { teamAId = "", teamBId = "", playerAId, playerBId, category = "DOUBLES", court, time, bestOf, gamePointTarget } = payload;

    if (category !== "SINGLES" && (!teamAId || !teamBId)) {
      return NextResponse.json({ error: "Team selection is required." }, { status: 400 });
    }

    const match = await createManualMatch(owner.id, tournamentId, teamAId, teamBId, court, time, Number(bestOf) || 3, category, playerAId, playerBId, Number(gamePointTarget) || 21);

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create match.";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
