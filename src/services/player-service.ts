import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { findCanonicalPlayerByPhone } from "@/services/player-identity-service";
import type { PlayerDraft, PlayerRecord } from "@/types/player";

function calculateAge(dateOfBirth: Date) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return age;
}

export async function listPlayerHistory(ownerId: string) {
  if (!prisma) {
    return [];
  }

  return prisma.playerHistory.findMany({ where: { ownerId } });
}

export async function listPlayerStats(ownerId: string) {
  if (!prisma) {
    return [];
  }

  return prisma.playerStatistic.findMany({ where: { ownerId } });
}

export async function getAllPlayersForUser(ownerId?: string): Promise<PlayerRecord[]> {
  if (!prisma) {
    return [];
  }

  try {
    const rows = await prisma.player.findMany({
      where: ownerId ? { createdById: ownerId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
    id: row.id,
    photoUrl: row.photoUrl ?? null,
    fullName: row.fullName,
    gender: row.gender as PlayerRecord["gender"],
    dateOfBirth: row.dateOfBirth.toISOString(),
    age: row.age,
    phoneNumber: row.phoneNumber ?? null,
    email: row.email ?? null,
    preferredHand: row.preferredHand as PlayerRecord["preferredHand"],
    playingLevel: row.playingLevel as PlayerRecord["playingLevel"],
    city: row.city,
    state: row.state,
    country: row.country,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
  } catch (error) {
    console.warn("Unable to load players during prerender:", error);
    return [];
  }
}

export async function createPlayer(data: PlayerDraft, ownerId: string): Promise<PlayerRecord | null> {
  if (!prisma) {
    return null;
  }

  const dateOfBirth = new Date(data.dateOfBirth);
  const normalizedPhone = normalizePhoneNumber(data.phoneNumber ?? "");
  if (!normalizedPhone) throw new Error("A valid mobile number is required.");

  const existing = await findCanonicalPlayerByPhone(normalizedPhone);
  if (existing) return toPlayerRecord(existing);

  const row = await prisma.player.create({
    data: {
      photoUrl: data.photoUrl || null,
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth,
      age: calculateAge(dateOfBirth),
      phoneNumber: normalizedPhone,
      normalizedPhone,
      email: data.email || null,
      preferredHand: data.preferredHand,
      playingLevel: data.playingLevel,
      city: data.city,
      state: data.state,
      country: data.country,
      createdById: ownerId,
    },
  });

  return toPlayerRecord(row);
}

function toPlayerRecord(row: {
  id: string;
  photoUrl: string | null;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
  age: number;
  phoneNumber: string | null;
  email: string | null;
  preferredHand: string;
  playingLevel: string;
  city: string;
  state: string;
  country: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): PlayerRecord {
  return {
    id: row.id,
    photoUrl: row.photoUrl ?? null,
    fullName: row.fullName,
    gender: row.gender as PlayerRecord["gender"],
    dateOfBirth: row.dateOfBirth.toISOString(),
    age: row.age,
    phoneNumber: row.phoneNumber ?? null,
    email: row.email ?? null,
    preferredHand: row.preferredHand as PlayerRecord["preferredHand"],
    playingLevel: row.playingLevel as PlayerRecord["playingLevel"],
    city: row.city,
    state: row.state,
    country: row.country,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPlayerById(id: string): Promise<PlayerRecord | null> {
  if (!prisma) {
    return null;
  }

  const row = await prisma.player.findUnique({ where: { id } });
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    photoUrl: row.photoUrl ?? null,
    fullName: row.fullName,
    gender: row.gender as PlayerRecord["gender"],
    dateOfBirth: row.dateOfBirth.toISOString(),
    age: row.age,
    phoneNumber: row.phoneNumber ?? null,
    email: row.email ?? null,
    preferredHand: row.preferredHand as PlayerRecord["preferredHand"],
    playingLevel: row.playingLevel as PlayerRecord["playingLevel"],
    city: row.city,
    state: row.state,
    country: row.country,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deletePlayer(id: string) {
  if (!prisma) {
    return null;
  }

  return prisma.player.delete({ where: { id } });
}
