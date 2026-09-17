import { getUser } from "@/lib/supabase/server";
import { createPlayer, getAllPlayersForUser } from "@/services/player-service";
import { ensurePrismaUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const owner = await ensurePrismaUser(user);
  const players = await getAllPlayersForUser(owner.id);
  return NextResponse.json(players, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const owner = await ensurePrismaUser(user);
    const player = await createPlayer(payload, owner.id);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create player.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
