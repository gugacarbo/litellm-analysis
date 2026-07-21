import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { rollbackBenchmarkSnapshotMigration } from "./rollback-benchmark-snapshot-migration.mjs";

const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const root = fileURLToPath(new URL("..", import.meta.url));
const migrationsFolder = join(root, "drizzle");
const freshMigrationsFolder = join(root, "drizzle-fresh");

function testTarget() {
  const raw = process.env.TEST_DATABASE_URL?.trim();
  if (!raw) throw new Error("TEST_DATABASE_URL is required");
  const url = new URL(raw);
  const database = url.pathname.slice(1);
  const schema = url.searchParams.get("schema")?.trim();
  if (
    !/(^|[-_])test($|[-_])/.test(database) ||
    !schema ||
    schema === "public" ||
    !identifier.test(schema)
  ) {
    throw new Error(
      "TEST_DATABASE_URL must use a test database and explicit non-public schema",
    );
  }
  url.searchParams.delete("schema");
  return { connectionString: url.toString(), prefix: schema };
}

function isolatedSchema(prefix, suffix) {
  const value = `${prefix}_${suffix}`;
  if (value.length > 63 || !identifier.test(value)) {
    throw new Error(
      "Isolated schema name is not a valid PostgreSQL identifier",
    );
  }
  return value;
}

function assertPair({ appSchema, migrationsSchema }, prefix) {
  for (const value of [appSchema, migrationsSchema]) {
    if (
      !identifier.test(value) ||
      value === "public" ||
      value === "drizzle" ||
      !value.startsWith(`${prefix}_`)
    ) {
      throw new Error("Every proof schema must be explicit and non-default");
    }
  }
  if (appSchema === migrationsSchema) {
    throw new Error("Application and migration schemas must be distinct");
  }
}

async function resetPair(client, pair, prefix) {
  assertPair(pair, prefix);
  for (const schema of [pair.appSchema, pair.migrationsSchema]) {
    await client.query(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`);
    await client.query(`CREATE SCHEMA ${quote(schema)}`);
  }
  await client.query(`SET search_path TO ${quote(pair.appSchema)}, public`);
}

async function ledgerSnapshot(client, schema) {
  const table = await client.query("SELECT to_regclass($1) AS name", [
    `${schema}.__drizzle_migrations`,
  ]);
  if (!table.rows[0]?.name) return null;
  const rows = await client.query(
    `SELECT hash, created_at FROM ${quote(schema)}.${quote("__drizzle_migrations")} ORDER BY created_at`,
  );
  return rows.rows;
}

async function protectedLedgers(client) {
  return {
    default: await ledgerSnapshot(client, "drizzle"),
    external: await ledgerSnapshot(client, "benchmark_migration_control"),
  };
}

async function assertProtectedLedgers(client, before) {
  const after = await protectedLedgers(client);
  if (JSON.stringify(after) !== JSON.stringify(before)) {
    throw new Error("A default or external migration ledger was modified");
  }
}

async function isolatedMigrationsFolder(source, schema) {
  const destination = await mkdtemp(join(tmpdir(), "benchmark-migrations-"));
  await cp(source, destination, { recursive: true });
  const journal = JSON.parse(
    await readFile(join(destination, "meta", "_journal.json"), "utf8"),
  );
  for (const entry of journal.entries) {
    const path = join(destination, `${entry.tag}.sql`);
    const contents = await readFile(path, "utf8");
    await writeFile(
      path,
      contents.replaceAll('"public".', `${quote(schema)}.`),
    );
  }
  return destination;
}

async function runMigrate(client, pair, folder, seenMigrationsSchemas) {
  await client.query(`SET search_path TO ${quote(pair.appSchema)}, public`);
  const config = {
    migrationsFolder: folder,
    migrationsSchema: pair.migrationsSchema,
  };
  seenMigrationsSchemas.push(config.migrationsSchema);
  await migrate(drizzle(client), config);
}

async function assertLedgerCount(client, schema, count) {
  const result = await client.query(
    `SELECT count(*)::int AS count FROM ${quote(schema)}.${quote("__drizzle_migrations")}`,
  );
  if (result.rows[0]?.count !== count) {
    throw new Error(
      `Expected ${count} migration ledger rows, got ${result.rows[0]?.count}`,
    );
  }
}

async function assertSnapshotTables(client, schema, expected) {
  const result = await client.query(
    "SELECT to_regclass($1) AS snapshots, to_regclass($2) AS entries",
    [`${schema}.benchmark_snapshots`, `${schema}.benchmark_snapshot_entries`],
  );
  const exists = Boolean(result.rows[0]?.snapshots && result.rows[0]?.entries);
  if (exists !== expected) {
    throw new Error(
      expected ? "Snapshot tables are missing" : "Snapshot tables still exist",
    );
  }
}

async function assertSnapshotForeignKeySchema(client, schema) {
  const result = await client.query(
    `SELECT constraint_table.nspname AS source_schema, referenced_table.nspname AS target_schema
     FROM pg_constraint
     INNER JOIN pg_class AS constraint_relation ON constraint_relation.oid = pg_constraint.conrelid
     INNER JOIN pg_namespace AS constraint_table ON constraint_table.oid = constraint_relation.relnamespace
     INNER JOIN pg_class AS referenced_relation ON referenced_relation.oid = pg_constraint.confrelid
     INNER JOIN pg_namespace AS referenced_table ON referenced_table.oid = referenced_relation.relnamespace
     WHERE pg_constraint.conname = 'benchmark_snapshot_entries_snapshot_id_benchmark_snapshots_id_fk'
       AND constraint_table.nspname = $1`,
    [schema],
  );
  if (
    result.rowCount !== 1 ||
    result.rows[0]?.source_schema !== schema ||
    result.rows[0]?.target_schema !== schema
  ) {
    throw new Error(
      "Snapshot foreign key does not stay in the application schema",
    );
  }
}

async function assertNoPublicSnapshotForeignKey() {
  for (const relativePath of [
    "0009_dusty_jigsaw.sql",
    "../drizzle-fresh/0000_clean-model-proxy-baseline.sql",
  ]) {
    const contents = await readFile(
      join(migrationsFolder, relativePath),
      "utf8",
    );
    if (contents.includes('REFERENCES "public"."benchmark_snapshots"')) {
      throw new Error(
        `${relativePath} hard-codes the benchmark snapshot FK to public`,
      );
    }
  }
}

async function prove0006(client, pair, prefix, withRevision) {
  const protectedBefore = await protectedLedgers(client);
  await resetPair(client, pair, prefix);
  const revision = withRevision ? ", revision integer NOT NULL DEFAULT 0" : "";
  await client.query(
    `CREATE TABLE model_proxy_models (id text PRIMARY KEY, reasoning jsonb, updated_at timestamp${revision})`,
  );
  await client.query(
    "INSERT INTO model_proxy_models (id, reasoning) VALUES ('changed', '{\"supportsVision\":true,\"other\":true}'), ('untouched', '{\"other\":true}')",
  );
  const sql = await readFile(
    join(migrationsFolder, "0006_remove-reasoning-supports-vision.sql"),
    "utf8",
  );
  await client.query(sql);
  const selectedColumns = withRevision
    ? "reasoning, updated_at, revision"
    : "reasoning, updated_at";
  const changed = await client.query(
    `SELECT ${selectedColumns} FROM model_proxy_models WHERE id = 'changed'`,
  );
  const untouched = await client.query(
    `SELECT ${selectedColumns} FROM model_proxy_models WHERE id = 'untouched'`,
  );
  if (
    changed.rows[0]?.reasoning.supportsVision !== undefined ||
    !changed.rows[0]?.updated_at
  ) {
    throw new Error("0006 did not remove supportsVision from the eligible row");
  }
  if (withRevision && changed.rows[0]?.revision !== 1) {
    throw new Error("0006 did not increment revision when the column exists");
  }
  if (!withRevision && Object.hasOwn(changed.rows[0], "revision")) {
    throw new Error("0006 referenced revision in the no-revision table shape");
  }
  if (untouched.rows[0]?.updated_at !== null) {
    throw new Error("0006 changed rows without supportsVision");
  }
  if (await ledgerSnapshot(client, pair.migrationsSchema)) {
    throw new Error(
      "Direct 0006 proof unexpectedly created a migration ledger",
    );
  }
  await assertProtectedLedgers(client, protectedBefore);
}

const { connectionString, prefix } = testTarget();
const client = new pg.Client({ connectionString });
const seenMigrationsSchemas = [];
const pairs = {
  noRevision: {
    appSchema: isolatedSchema(prefix, "0006_no_revision"),
    migrationsSchema: isolatedSchema(prefix, "0006_no_revision_migrations"),
  },
  withRevision: {
    appSchema: isolatedSchema(prefix, "0006_with_revision"),
    migrationsSchema: isolatedSchema(prefix, "0006_with_revision_migrations"),
  },
  incremental: {
    appSchema: isolatedSchema(prefix, "incremental"),
    migrationsSchema: isolatedSchema(prefix, "incremental_migrations"),
  },
  fresh: {
    appSchema: isolatedSchema(prefix, "fresh"),
    migrationsSchema: isolatedSchema(prefix, "fresh_migrations"),
  },
};

await client.connect();
const temporaryFolders = [];
try {
  await assertNoPublicSnapshotForeignKey();
  await prove0006(client, pairs.noRevision, prefix, false);
  await prove0006(client, pairs.withRevision, prefix, true);

  const incrementalFolder = await isolatedMigrationsFolder(
    migrationsFolder,
    pairs.incremental.appSchema,
  );
  temporaryFolders.push(incrementalFolder);
  const incrementalBefore = await protectedLedgers(client);
  await resetPair(client, pairs.incremental, prefix);
  await runMigrate(
    client,
    pairs.incremental,
    incrementalFolder,
    seenMigrationsSchemas,
  );
  await assertLedgerCount(client, pairs.incremental.migrationsSchema, 11);
  await assertSnapshotTables(client, pairs.incremental.appSchema, true);
  await assertSnapshotForeignKeySchema(client, pairs.incremental.appSchema);
  await client.query(
    "INSERT INTO benchmark_snapshots (catalog, source_label, source_url, fetched_at, count) VALUES ('sentinel', 'test', 'https://example.test', now(), 0)",
  );
  await runMigrate(
    client,
    pairs.incremental,
    incrementalFolder,
    seenMigrationsSchemas,
  );
  const sentinel = await client.query(
    "SELECT count(*)::int AS count FROM benchmark_snapshots WHERE catalog = 'sentinel'",
  );
  if (sentinel.rows[0]?.count !== 1)
    throw new Error("Ledgered rerun changed the sentinel");
  await assertProtectedLedgers(client, incrementalBefore);

  await rollbackBenchmarkSnapshotMigration({
    client,
    targetSchema: pairs.incremental.appSchema,
    migrationsSchema: pairs.incremental.migrationsSchema,
    schemaPrefix: `${prefix}_`,
  });
  await assertLedgerCount(client, pairs.incremental.migrationsSchema, 9);
  await assertSnapshotTables(client, pairs.incremental.appSchema, false);
  await runMigrate(
    client,
    pairs.incremental,
    incrementalFolder,
    seenMigrationsSchemas,
  );
  await assertLedgerCount(client, pairs.incremental.migrationsSchema, 11);
  await assertSnapshotTables(client, pairs.incremental.appSchema, true);
  await assertSnapshotForeignKeySchema(client, pairs.incremental.appSchema);
  await assertProtectedLedgers(client, incrementalBefore);

  const freshFolder = await isolatedMigrationsFolder(
    freshMigrationsFolder,
    pairs.fresh.appSchema,
  );
  temporaryFolders.push(freshFolder);
  const freshBefore = await protectedLedgers(client);
  await resetPair(client, pairs.fresh, prefix);
  await runMigrate(client, pairs.fresh, freshFolder, seenMigrationsSchemas);
  await assertLedgerCount(client, pairs.fresh.migrationsSchema, 1);
  await assertSnapshotTables(client, pairs.fresh.appSchema, true);
  await assertProtectedLedgers(client, freshBefore);

  const expected = [
    pairs.incremental.migrationsSchema,
    pairs.incremental.migrationsSchema,
    pairs.incremental.migrationsSchema,
    pairs.fresh.migrationsSchema,
  ];
  if (JSON.stringify(seenMigrationsSchemas) !== JSON.stringify(expected)) {
    throw new Error(
      "Every Drizzle migrate call must receive its explicit isolated migrationsSchema",
    );
  }
  console.log(
    "PASS: isolated forward, rerun, rollback/reapply, fresh, and 0006 shape proofs",
  );
} finally {
  for (const folder of temporaryFolders)
    await rm(folder, { recursive: true, force: true });
  for (const pair of Object.values(pairs)) {
    for (const schema of [pair.appSchema, pair.migrationsSchema]) {
      await client.query(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`);
    }
  }
  await client.end();
}
