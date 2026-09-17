import { getUser } from "@/lib/supabase/server";
import { createPlayerAndAttachToTeam } from "@/services/team-service";
import { ensurePrismaUser } from "@/services/user-service";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ teamId: string }> }) {
  await context.params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json([], { status: 200 });
}

export async function POST(request: Request, context: { params: Promise<{ teamId: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { teamId } = await context.params;

  try {
    const payload = await request.json();
    const owner = await ensurePrismaUser(user);
    const player = await createPlayerAndAttachToTeam(payload, owner.id, teamId);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add player.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
