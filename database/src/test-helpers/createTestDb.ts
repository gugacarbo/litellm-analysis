import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createTestDb(): Promise<{
  db: ReturnType<typeof drizzle>;
  stop: () => Promise<void>;
}> {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgresql://localhost:5432/test",
    max: 1,
  });

  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../../drizzle"),
  });

  return {
    db,
    stop: async () => {
      await pool.end();
    },
  };
}
