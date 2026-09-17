import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export type SupabaseUserPayload = {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: {
    name?: string;
    phoneNumber?: string;
    phone?: string;
    [key: string]: unknown;
  };
};

export async function ensurePrismaUser(user: SupabaseUserPayload) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const name = user.user_metadata?.name ?? user.email ?? "Unknown";
  const rawPhoneNumber = user.user_metadata?.phoneNumber ?? user.user_metadata?.phone ?? null;
  const phoneNumber = rawPhoneNumber ? normalizePhoneNumber(rawPhoneNumber) : null;

  const existingById = await prisma.user.findUnique({ where: { id: user.id } });
  if (existingById) {
    if (phoneNumber) {
      const users = await prisma.user.findMany({ where: { phoneNumber: { not: null } }, orderBy: { createdAt: "asc" } });
      const existingByPhone = users.find((candidate) => candidate.id !== existingById.id && normalizePhoneNumber(candidate.phoneNumber ?? "") === phoneNumber);
      if (existingByPhone) {
        if (existingByPhone.phoneNumber !== phoneNumber) return prisma.user.update({ where: { id: existingByPhone.id }, data: { phoneNumber } });
        return existingByPhone;
      }
    }
    return prisma.user.update({ where: { id: existingById.id }, data: { name, email: user.email ?? undefined, phoneNumber: phoneNumber ?? undefined } });
  }

  if (phoneNumber) {
    const users = await prisma.user.findMany({ where: { phoneNumber: { not: null } }, orderBy: { createdAt: "asc" } });
    const existingByPhone = users.find((candidate) => normalizePhoneNumber(candidate.phoneNumber ?? "") === phoneNumber);
    if (existingByPhone) {
      if (existingByPhone.phoneNumber !== phoneNumber) return prisma.user.update({ where: { id: existingByPhone.id }, data: { phoneNumber } });
      return existingByPhone;
    }
  }

  return prisma.user.create({
    data: {
      id: user.id,
      name,
      email: user.email ?? "",
      phoneNumber,
    },
  });
}
