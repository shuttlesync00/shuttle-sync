import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { finalizeMatchTransactional, initializeMatchIfNeeded, undoMatchPoint, updateMatchScore } from "@/services/live-score-service";
import { deleteMatch } from "@/services/match-service";
import { ensurePrismaUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await context.params;
  const match = await initializeMatchIfNeeded(matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  return NextResponse.json(match, { status: 200 });
}

export async function PATCH(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const body = await request.json();
  const owner = await ensurePrismaUser(user);
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }
  // verify ownership: match belongs to a tournament owned by the user
  const matchRow = await prisma.match.findUnique({ where: { id: matchId }, include: { tournament: true } });
  if (!matchRow) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (matchRow.ownerId !== owner.id && (!matchRow.tournament || matchRow.tournament.ownerId !== owner.id)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  if (matchRow.tournament?.status === "COMPLETED") {
    return NextResponse.json({ error: "Tournament already completed." }, { status: 400 });
  }
  if (body.action === "point") {
    try {
      const match = await updateMatchScore(matchId, body.side);
      return match ? NextResponse.json(match, { status: 200 }) : NextResponse.json({ error: "Match not found." }, { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update score.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "undo") {
    try {
      const match = await undoMatchPoint(matchId, body.side);
      return match ? NextResponse.json(match, { status: 200 }) : NextResponse.json({ error: "Match not found." }, { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to undo point.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "finalize") {
    try {
      const match = await finalizeMatchTransactional(matchId);
      return match ? NextResponse.json(match, { status: 200 }) : NextResponse.json({ error: "Match not found." }, { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to finalize match.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { matchId } = await context.params;
  const owner = await ensurePrismaUser(user);
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const matchRow = await prisma.match.findUnique({ where: { id: matchId } });
  if (!matchRow) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (matchRow.ownerId !== owner.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    await deleteMatch(matchId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete match.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
