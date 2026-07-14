import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

function getTestDatabaseConfig(): {
  connectionString: string;
  options: string;
} {
  const rawDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!rawDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required. Reset the isolated test schema before using createTestDb.",
    );
  }

  const databaseUrl = new URL(rawDatabaseUrl);
  const schema = databaseUrl.searchParams.get("schema")?.trim();
  if (
    !schema ||
    schema === "public" ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)
  ) {
    throw new Error(
      "TEST_DATABASE_URL must declare a valid explicit non-public schema.",
    );
  }

  databaseUrl.searchParams.delete("schema");
  return {
    connectionString: databaseUrl.toString(),
    options: `-c search_path=${schema},public`,
  };
}

export async function createTestDb(): Promise<{
  db: ReturnType<typeof drizzle>;
  stop: () => Promise<void>;
}> {
  const { connectionString, options } = getTestDatabaseConfig();
  const pool = new Pool({ connectionString, max: 1, options });

  return {
    db: drizzle(pool),
    stop: async () => {
      await pool.end();
    },
  };
}
