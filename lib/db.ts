import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Local dev (no TURSO_DATABASE_URL set) → plain SQLite file via
 * better-sqlite3, zero setup.
 * Production on Vercel (TURSO_DATABASE_URL set) → the same schema over
 * Turso/libSQL. Nothing else in the app changes between the two.
 */
// Loaded lazily: better-sqlite3 is a native module, and a production
// deployment on Turso should never have to load (or fail to load) it.
function localSqliteAdapter() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3"))
    .PrismaBetterSqlite3;
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  const adapter = tursoUrl
    ? new PrismaLibSql({
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      })
    : new (localSqliteAdapter())({
        url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
      });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
