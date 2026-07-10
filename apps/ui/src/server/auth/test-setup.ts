import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const authTestDir = import.meta.dirname;

export type TestDb = ReturnType<typeof drizzle>;

export async function createTestDb(): Promise<{
  db: TestDb;
  stop: () => Promise<void>;
}> {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is required to run integration tests");
  }

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: resolve(authTestDir, "../../../../../../database/drizzle"),
  });

  await db.execute(
    sql`TRUNCATE TABLE "user", session, account, verification, app_invite RESTART IDENTITY CASCADE`,
  );

  return {
    db,
    stop: async () => {
      await pool.end();
    },
  };
}
