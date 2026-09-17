import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizeConnectionString(raw: string) {
  try {
    const url = new URL(raw);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode && ["prefer", "require", "verify-ca", "verify-full"].includes(sslmode)) {
      url.searchParams.set("libpqcompat", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const normalizedConnectionString = connectionString ? normalizeConnectionString(connectionString) : undefined;

const poolConfig: PoolConfig | undefined = normalizedConnectionString
  ? {
      connectionString: normalizedConnectionString,
      ssl: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    }
  : undefined;

export const prisma = connectionString
  ? (globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(new Pool(poolConfig)) }))
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
