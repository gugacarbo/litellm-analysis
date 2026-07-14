import { pgSchema, pgTable } from "drizzle-orm/pg-core";

function readModelProxySchemaName(): string | undefined {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!testDatabaseUrl) {
    return undefined;
  }

  const schemaName = new URL(testDatabaseUrl).searchParams
    .get("schema")
    ?.trim();

  if (!schemaName || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(schemaName)) {
    throw new Error(
      "TEST_DATABASE_URL must declare a valid PostgreSQL schema identifier",
    );
  }

  return schemaName;
}

const schemaName = readModelProxySchemaName();

export const modelProxySchema = schemaName ? pgSchema(schemaName) : undefined;

// Production keeps the public schema. Isolated integration tests opt into an
// explicit schema before importing the Drizzle tables.
export const modelProxyTable = (
  modelProxySchema ? modelProxySchema.table : pgTable
) as typeof pgTable;
