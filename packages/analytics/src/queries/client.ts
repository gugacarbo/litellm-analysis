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
});

export const db = drizzle(pool, { schema });

export { schema };
