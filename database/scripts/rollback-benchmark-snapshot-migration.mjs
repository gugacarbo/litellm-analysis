import { readFile } from "node:fs/promises";

const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quote(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function assertIsolatedSchema(value, name, prefix) {
  if (
    !identifier.test(value) ||
    value === "public" ||
    value === "drizzle" ||
    !value.startsWith(prefix)
  ) {
    throw new Error(`${name} must be an isolated, non-default schema`);
  }
}

/**
 * Rolls back only migration 0009 from the explicitly supplied test schemas.
 * This is deliberately not a production migration command: it exists solely
 * to prove that the generated down SQL and Drizzle ledger can be reversed and
 * reapplied without touching the default ledger.
 */
export async function rollbackBenchmarkSnapshotMigration({
  client,
  targetSchema,
  migrationsSchema,
  schemaPrefix,
}) {
  assertIsolatedSchema(targetSchema, "targetSchema", schemaPrefix);
  assertIsolatedSchema(migrationsSchema, "migrationsSchema", schemaPrefix);
  if (targetSchema === migrationsSchema) {
    throw new Error("targetSchema and migrationsSchema must be distinct");
  }

  const journal = JSON.parse(
    await readFile(
      new URL("../drizzle/meta/_journal.json", import.meta.url),
      "utf8",
    ),
  );
  const migration = journal.entries.filter(
    (entry) => entry.tag === "0009_dusty_jigsaw",
  );
  if (migration.length !== 1) {
    throw new Error("Expected exactly one 0009 migration journal entry");
  }
  const [{ when }] = migration;
  const ledger = `${quote(migrationsSchema)}.${quote("__drizzle_migrations")}`;
  const applied = await client.query(
    `SELECT "created_at" FROM ${ledger} WHERE "created_at" = $1`,
    [when],
  );
  if (applied.rowCount !== 1) {
    throw new Error("Expected exactly one applied 0009 migration ledger row");
  }

  const down = await readFile(
    new URL("../drizzle/0009_dusty_jigsaw.down.sql", import.meta.url),
    "utf8",
  );
  await client.query(`SET search_path TO ${quote(targetSchema)}, public`);
  await client.query("BEGIN");
  try {
    await client.query(down);
    const removed = await client.query(
      `DELETE FROM ${ledger} WHERE "created_at" = $1`,
      [when],
    );
    if (removed.rowCount !== 1) {
      throw new Error(
        "Expected to remove exactly one 0009 migration ledger row",
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
