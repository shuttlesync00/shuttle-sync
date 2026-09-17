import { getTournamentStandings } from "@/services/analytics-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get("tournamentId");
  if (!tournamentId) return NextResponse.json({ error: "tournamentId is required" }, { status: 400 });

  try {
    const standings = await getTournamentStandings(tournamentId);
    return NextResponse.json({ standings }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to fetch standings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
