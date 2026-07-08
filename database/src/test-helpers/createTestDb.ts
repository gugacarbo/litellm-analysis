import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

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

  await migrate(db, { migrationsFolder: "./drizzle" });

  return {
    db,
    stop: async () => {
      await pool.end();
    },
  };
}
