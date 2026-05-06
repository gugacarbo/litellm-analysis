import { serverEnv } from "@lite-llm/config/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  host: serverEnv.DB_HOST,
  port: serverEnv.DB_PORT,
  database: serverEnv.DB_NAME,
  user: serverEnv.DB_USER,
  password: serverEnv.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

export { schema };

const RETRY_COUNT = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

export async function ensureConnected(): Promise<void> {
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      return;
    } catch (error) {
      if (attempt === RETRY_COUNT) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAYS[attempt - 1]),
      );
    }
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
