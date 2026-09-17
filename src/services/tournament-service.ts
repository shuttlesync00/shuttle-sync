import { prisma } from "@/lib/prisma";
import type { TournamentDraft, TournamentRecord } from "@/types/tournament";
import type { Prisma, PrismaClient } from "@prisma/client";

const tournamentSelect = {
  id: true,
  bannerUrl: true,
  logoUrl: true,
  name: true,
  city: true,
  ground: true,
  organizerName: true,
  organizerPhone: true,
  organizerEmail: true,
  startDate: true,
  endDate: true,
  type: true,
  matchCategories: true,
  shuttleType: true,
  bestOf: true,
  description: true,
  status: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type TournamentRow = Prisma.TournamentGetPayload<{ select: typeof tournamentSelect }>;

function toTournamentRecord(row: TournamentRow): TournamentRecord {
  const matchCategories = Array.isArray(row.matchCategories)
    ? (row.matchCategories as TournamentRecord["matchCategories"])
    : [];

  return {
    id: row.id,
    bannerUrl: row.bannerUrl,
    logoUrl: row.logoUrl,
    name: row.name,
    city: row.city,
    ground: row.ground,
    organizerName: row.organizerName,
    organizerPhone: row.organizerPhone,
    organizerEmail: row.organizerEmail,
    startDate: row.startDate?.toISOString() ?? "",
    endDate: row.endDate?.toISOString() ?? "",
    type: row.type as TournamentRecord["type"],
    matchCategories,
    shuttleType: row.shuttleType as TournamentRecord["shuttleType"],
    bestOf: row.bestOf,
    description: row.description ?? null,
    status: (row.status as TournamentRecord["status"]) ?? "UPCOMING",
    createdById: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTournamentsForUser(userId: string): Promise<TournamentRecord[]> {
  if (!prisma) {
    return [];
  }

  try {
    await refreshTournamentStatuses();
    const rows = await prisma.tournament.findMany({
      where: { ownerId: userId },
      select: tournamentSelect,
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toTournamentRecord);
  } catch (error) {
    console.warn("Unable to load tournaments during prerender:", error);
    return [];
  }
}

export async function getDashboardTournaments(userId: string) {
  if (!prisma) return { currentTournament: null, recentTournaments: [] as TournamentRecord[] };

  await refreshTournamentStatuses();
  const [current, recent] = await Promise.all([
    prisma.tournament.findFirst({
      where: { ownerId: userId, status: { not: "COMPLETED" } },
      select: tournamentSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournament.findMany({
      where: { ownerId: userId },
      select: tournamentSelect,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  return {
    currentTournament: current ? toTournamentRecord(current) : null,
    recentTournaments: recent.map(toTournamentRecord),
  };
}

export async function createTournament(userId: string, data: TournamentDraft): Promise<TournamentRecord> {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const row = await prisma.tournament.create({
    data: {
      name: data.name,
      city: data.city,
      ground: data.ground,
      organizerName: data.organizerName,
      organizerPhone: data.organizerPhone,
      organizerEmail: data.organizerEmail,
      type: data.type,
      matchCategories: data.matchCategories,
      shuttleType: data.shuttleType,
      bestOf: data.bestOf,
      description: data.description ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      ownerId: userId,
      status: "UPCOMING",
    },
  });

  return {
    id: row.id,
    bannerUrl: row.bannerUrl,
    logoUrl: row.logoUrl,
    name: row.name,
    city: data.city,
    ground: data.ground,
    organizerName: data.organizerName,
    organizerPhone: data.organizerPhone,
    organizerEmail: data.organizerEmail,
    startDate: row.startDate?.toISOString() ?? "",
    endDate: row.endDate?.toISOString() ?? "",
    type: data.type,
    matchCategories: data.matchCategories,
    shuttleType: data.shuttleType,
    description: row.description ?? null,
    bestOf: row.bestOf,
    status: "UPCOMING",
    createdById: userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getTournamentById(id: string): Promise<TournamentRecord | null> {
  if (!prisma) {
    return null;
  }

  await refreshTournamentStatuses();
  const row = await prisma.tournament.findUnique({ where: { id }, select: tournamentSelect });

  if (!row) {
    return null;
  }

  return toTournamentRecord(row);
}

export async function deleteTournament(id: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  return prisma.tournament.delete({ where: { id } });
}

export async function completeTournamentIfReady(tournamentId: string, ownerId: string, tx?: PrismaClient | Prisma.TransactionClient) {
  const client = tx ?? prisma;
  if (!client) return false;

  const tournament = await client.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return false;
  if (tournament.ownerId !== ownerId) return false;
  if (tournament.status === "COMPLETED") return false;

  return false;
}

export async function refreshTournamentStatuses() {
  if (!prisma) return;
  await prisma.tournament.updateMany({
    where: { status: { not: "COMPLETED" }, endDate: { lte: new Date() } },
    data: { status: "COMPLETED" },
  });
}
