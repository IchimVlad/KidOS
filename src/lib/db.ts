import { parseEnv } from "@neon/env";
import { Pool } from "pg";
import config from "../../neon";

const globalForDb = globalThis as typeof globalThis & {
  kidosPool?: Pool;
};

function getPool(): Pool {
  const existing = globalForDb.kidosPool;
  if (existing) {
    return existing;
  }

  const { postgres } = parseEnv(config, ["DATABASE_URL"]);
  const pool = new Pool({
    connectionString: postgres.databaseUrl,
    max: 1,
  });
  pool.on("error", () => {
    console.error("Conexiunea idle către Postgres s-a închis.");
  });
  globalForDb.kidosPool = pool;
  return pool;
}

export async function pingDatabase(): Promise<{ ok: true; database: string }> {
  const result = await getPool().query<{ database: string }>(
    "select current_database() as database",
  );
  const database = result.rows[0]?.database;

  if (typeof database !== "string" || database.length === 0) {
    throw new Error("Postgres nu a returnat numele bazei.");
  }

  return { ok: true, database };
}
