import { getUser } from "@/lib/supabase/server";
import { deletePlayer, getPlayerById } from "@/services/player-service";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await context.params;
  const player = await getPlayerById(playerId);
  return NextResponse.json(player, { status: 200 });
}

export async function PATCH(request: Request, context: { params: Promise<{ playerId: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { playerId } = await context.params;
  return NextResponse.json({ id: playerId }, { status: 200 });
}

export async function DELETE(request: Request, context: { params: Promise<{ playerId: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { playerId } = await context.params;
  try {
    await deletePlayer(playerId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete player.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
