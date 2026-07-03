import { serverEnv } from "@lite-llm/config/server";
import type { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: serverEnv.DATABASE_URL,
    });
  }
  return pool;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool());
  }
  return dbInstance;
}

export type DatabaseClient = ReturnType<typeof getDb>;

export const db = getDb();

export async function disconnectDb(): Promise<void> {
  if (dbInstance) {
    await getPool().end();
    pool = null;
    dbInstance = null;
  }
}

export async function queryRaw<T>(
  query: ReturnType<typeof sql>,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(query as unknown as string, params);
  return result.rows as T[];
}
