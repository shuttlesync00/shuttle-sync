import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const directUrl = process.env.DIRECT_URL;
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: directUrl || env("DATABASE_URL"),
    shadowDatabaseUrl: shadowDatabaseUrl || undefined,
  },
});