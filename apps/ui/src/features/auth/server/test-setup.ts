import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { appInvites } from "@lite-llm/database/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const authTestDir = import.meta.dirname;
const schemaIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type TestDb = ReturnType<typeof drizzle>;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function createIsolatedSchemas(connectionString: string): {
  connectionString: string;
  appSchema: string;
  migrationsSchema: string;
} {
  const databaseUrl = new URL(connectionString);
  const prefix = databaseUrl.searchParams.get("schema")?.trim();
  if (!prefix || prefix === "public" || !schemaIdentifier.test(prefix)) {
    throw new Error(
      "TEST_DATABASE_URL must declare a valid explicit non-public schema.",
    );
  }

  const suffix = randomUUID().replaceAll("-", "");
  const base = prefix.slice(0, 24);
  const appSchema = `${base}_auth_${suffix.slice(0, 12)}`;
  const migrationsSchema = `${base}_auth_migrations_${suffix.slice(0, 12)}`;
  databaseUrl.searchParams.delete("schema");

  return {
    connectionString: databaseUrl.toString(),
    appSchema,
    migrationsSchema,
  };
}

export async function createTestDb(): Promise<{
  db: TestDb;
  stop: () => Promise<void>;
}> {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is required to run integration tests");
  }

  const {
    appSchema,
    connectionString: databaseUrl,
    migrationsSchema,
  } = createIsolatedSchemas(connectionString);
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    options: `-c search_path=${appSchema},public`,
  });
  const db = drizzle(pool);
  let stopped = false;

  try {
    await db.execute(sql.raw(`CREATE SCHEMA ${quoteIdentifier(appSchema)}`));
    await db.execute(
      sql.raw(`CREATE SCHEMA ${quoteIdentifier(migrationsSchema)}`),
    );
    await migrate(db, {
      migrationsFolder: resolve(
        authTestDir,
        "../../../../../../database/drizzle",
      ),
      migrationsSchema,
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
  } catch (error) {
    await pool.query(
      `DROP SCHEMA IF EXISTS ${quoteIdentifier(migrationsSchema)} CASCADE`,
    );
    await pool.query(
      `DROP SCHEMA IF EXISTS ${quoteIdentifier(appSchema)} CASCADE`,
    );
    await pool.end();
    throw error;
  }

  return {
    db,
    stop: async () => {
      if (stopped) return;
      stopped = true;
      await pool.query(
        `DROP SCHEMA ${quoteIdentifier(migrationsSchema)} CASCADE`,
      );
      await pool.query(`DROP SCHEMA ${quoteIdentifier(appSchema)} CASCADE`);
      await pool.end();
    },
  };
}
