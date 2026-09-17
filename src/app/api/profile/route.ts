import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = prisma ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
  return NextResponse.json({ user, profile }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const name = typeof payload?.name === "string" ? payload.name : user.user_metadata?.name ?? user.email ?? "User";
    const email = typeof payload?.email === "string" ? payload.email : user.email ?? null;
    const phoneNumber = normalizePhoneNumber(typeof payload?.phoneNumber === "string" ? payload.phoneNumber : "");
    const profileImage = typeof payload?.profileImage === "string" ? payload.profileImage : typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

    if (!phoneNumber) {
      return NextResponse.json({ error: "A valid mobile number is required." }, { status: 400 });
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database not configured." }, { status: 500 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
    const existingByPhone = await prisma.user.findFirst({
      where: {
        AND: [
          { phoneNumber: { not: null } },
          { phoneNumber: { equals: phoneNumber } },
        ],
      },
    });

    if (existingByPhone && existingByPhone.id !== user.id) {
      return NextResponse.json({ error: "This mobile number is already associated with another account." }, { status: 409 });
    }

    const saved = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name,
        email: email ?? existingUser?.email ?? null,
        phoneNumber,
        profileImage,
      },
      create: {
        id: user.id,
        name,
        email: email ?? null,
        phoneNumber,
        profileImage,
      },
    });

    return NextResponse.json({ profile: saved }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save profile." }, { status: 500 });
  }
}
