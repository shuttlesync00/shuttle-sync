import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import type { Player } from "@prisma/client";

export async function findCanonicalPlayerByPhone(phoneNumber: string): Promise<Player | null> {
  if (!prisma) return null;

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) return null;

  const exact = await prisma.player.findUnique({ where: { normalizedPhone } });
  if (exact) return exact;

  const legacyPlayers = await prisma.player.findMany({
    where: { phoneNumber: { not: null } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const legacyMatch = legacyPlayers.find((player) => normalizePhoneNumber(player.phoneNumber ?? "") === normalizedPhone);
  if (!legacyMatch) return null;

  try {
    return await prisma.player.update({ where: { id: legacyMatch.id }, data: { phoneNumber: normalizedPhone, normalizedPhone } });
  } catch {
    return prisma.player.findUnique({ where: { normalizedPhone } });
  }
}

export async function findOrCreateCanonicalPlayer(input: {
  phoneNumber: string;
  createdById: string;
  fullName: string;
  email?: string | null;
  city?: string;
  country?: string;
}): Promise<Player> {
  if (!prisma) throw new Error("Database is not configured.");

  const normalizedPhone = normalizePhoneNumber(input.phoneNumber);
  if (!normalizedPhone) throw new Error("A valid mobile number is required.");

  const existing = await findCanonicalPlayerByPhone(normalizedPhone);
  if (existing) return existing;

  try {
    return await prisma.player.create({
      data: {
        fullName: input.fullName || "Player",
        gender: "OTHER",
        dateOfBirth: new Date("1970-01-01T00:00:00.000Z"),
        age: new Date().getFullYear() - 1970,
        phoneNumber: normalizedPhone,
        normalizedPhone,
        email: input.email ?? null,
        preferredHand: "RIGHT",
        playingLevel: "BEGINNER",
        city: input.city ?? "",
        state: "",
        country: input.country ?? "",
        createdById: input.createdById,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const concurrent = await prisma.player.findUnique({ where: { normalizedPhone } });
      if (concurrent) return concurrent;
    }
    throw error;
  }
}
