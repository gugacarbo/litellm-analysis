import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { appInvites } from "@lite-llm/database/schema";
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
  let stopped = false;

  await migrate(db, {
    migrationsFolder: resolve(
      authTestDir,
      "../../../../../../database/drizzle",
    ),
  });

  await db.execute(
    sql`TRUNCATE TABLE "user", session, account, verification, app_invite RESTART IDENTITY CASCADE`,
  );
  await db.insert(appInvites).values({
    id: "bootstrap-invite",
    email: "bootstrap@example.com",
    tokenHash: createHash("sha256")
      .update("test-secret-for-bootstrap-only")
      .digest("hex"),
    role: "admin",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    db,
    stop: async () => {
      if (stopped) return;
      stopped = true;
      await pool.end();
    },
  };
}
