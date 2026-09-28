/**
 * Creates (or additively updates) the database schema from
 * prisma/schema.prisma without needing Prisma's schema engine:
 *
 *   - TURSO_DATABASE_URL set  → applies to Turso/libSQL (production)
 *   - otherwise               → applies to the local SQLite file
 *                               (DATABASE_URL, default file:./prisma/dev.db)
 *
 * Safe to re-run: tables/indexes use IF NOT EXISTS, and columns that a
 * newer schema added are appended with ALTER TABLE ADD COLUMN. It never
 * drops or rewrites anything — for destructive changes (renaming or
 * removing a column) use `prisma migrate diff` and review the SQL.
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { buildSchemaSql, listColumns } from "./schema-sql";

type Runner = {
  label: string;
  exec: (sql: string) => Promise<void>;
  columns: (table: string) => Promise<string[]>;
  close: () => void;
};

function openTarget(): Runner {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return {
      label: `Turso (${tursoUrl})`,
      exec: async (sql) => {
        await client.executeMultiple(sql);
      },
      columns: async (table) => {
        const r = await client.execute(`PRAGMA table_info("${table}")`);
        return r.rows.map((row) => String(row.name));
      },
      close: () => client.close(),
    };
  }

  const url = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(
    /^file:/,
    "",
  );
  const db = new Database(url);
  return {
    label: `SQLite (${url})`,
    exec: async (sql) => {
      db.exec(sql);
    },
    columns: async (table) =>
      (db.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[]).map(
        (r) => r.name,
      ),
    close: () => db.close(),
  };
}

async function main() {
  const target = openTarget();
  console.log(`→ Applying schema to ${target.label}`);

  await target.exec(buildSchemaSql());

  // Additive sync for databases created from an older schema version.
  let added = 0;
  for (const [table, wanted] of listColumns()) {
    const existing = new Set(await target.columns(table));
    for (const col of wanted) {
      if (existing.has(col.name)) continue;
      if (/NOT NULL/.test(col.def) && !/DEFAULT/.test(col.def)) {
        console.warn(
          `! ${table}.${col.name} is NOT NULL without a default — add it manually (SQLite can't ALTER it in).`,
        );
        continue;
      }
      const def = col.def.replace(/ NOT NULL PRIMARY KEY/, "");
      await target.exec(`ALTER TABLE "${table}" ADD COLUMN ${def};`);
      console.log(`  + ${table}.${col.name}`);
      added++;
    }
  }

  target.close();
  console.log(`✓ Schema ready${added ? ` (${added} column(s) added)` : ""}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
