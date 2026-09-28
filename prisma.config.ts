import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    // A default so `npm install` (which runs `prisma generate`) works on a
    // fresh clone with no .env yet. Production uses Turso through
    // lib/db.ts instead — see README → "دیتابیس روی Vercel (Turso)".
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
