import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { createTournament, deleteTournament } from "@/services/tournament-service";
import { ensurePrismaUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    await ensurePrismaUser({ ...user, email: user.email ?? null });
    const payload = await request.json();
    const tournament = await createTournament(user.id, payload);

    return NextResponse.json({ id: tournament.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create tournament.";
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
    return NextResponse.json({ error: "Tournament id is required." }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }
  if (tournament.ownerId !== user.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    await deleteTournament(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete tournament.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const payload = await request.json();
  if (!payload.id || !["END", "UPDATE_END_DATE"].includes(payload.action)) return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  const tournament = await prisma.tournament.findUnique({ where: { id: payload.id } });
  if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  if (tournament.ownerId !== user.id) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  const updated = await prisma.tournament.update({ where: { id: payload.id }, data: payload.action === "END" ? { status: "COMPLETED" } : { endDate: new Date(payload.endDate) } });
  return NextResponse.json({ id: updated.id, status: updated.status }, { status: 200 });
}
