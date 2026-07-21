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
 * Rolls back the benchmark snapshot migration pair from the explicitly
 * supplied test schemas.
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
  const migrations = [
    "0009_dusty_jigsaw",
    "0010_benchmark_snapshot_schema_repair",
  ].map((tag) => {
    const entry = journal.entries.filter((candidate) => candidate.tag === tag);
    if (entry.length !== 1) {
      throw new Error(`Expected exactly one ${tag} migration journal entry`);
    }
    return entry[0];
  });
  const [migration0009, migration0010] = migrations;
  if (migration0009.when >= migration0010.when) {
    throw new Error("Benchmark snapshot migrations are not ordered correctly");
  }
  const ledger = `${quote(migrationsSchema)}.${quote("__drizzle_migrations")}`;
  const applied = await client.query(
    `SELECT "created_at" FROM ${ledger} WHERE "created_at" = ANY($1) ORDER BY "created_at"`,
    [migrations.map(({ when }) => when)],
  );
  if (applied.rowCount !== migrations.length) {
    throw new Error(
      "Expected both benchmark snapshot migrations in the ledger",
    );
  }

  await client.query(`SET search_path TO ${quote(targetSchema)}, public`);
  await client.query("BEGIN");
  try {
    for (const tag of [
      "0010_benchmark_snapshot_schema_repair",
      "0009_dusty_jigsaw",
    ]) {
      const down = await readFile(
        new URL(`../drizzle/${tag}.down.sql`, import.meta.url),
        "utf8",
      );
      await client.query(down);
      const migration = migrations.find((candidate) => candidate.tag === tag);
      const removed = await client.query(
        `DELETE FROM ${ledger} WHERE "created_at" = $1`,
        [migration.when],
      );
      if (removed.rowCount !== 1) {
        throw new Error(`Expected to remove exactly one ${tag} ledger row`);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
