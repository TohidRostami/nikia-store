import Database from "better-sqlite3";
import { rmSync } from "node:fs";
import { buildSchemaSql } from "../scripts/schema-sql";

/** A throwaway SQLite database, built from the real schema, for the order-flow tests. */
export default function setup() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`prisma/test.db${suffix}`, { force: true });
  }
  const db = new Database("prisma/test.db");
  db.exec(buildSchemaSql());
  db.close();

  return () => {
    for (const suffix of ["", "-journal", "-wal", "-shm"]) {
      rmSync(`prisma/test.db${suffix}`, { force: true });
    }
  };
}
