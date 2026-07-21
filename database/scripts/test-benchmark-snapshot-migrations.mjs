import { readFile } from "node:fs/promises";
import pg from "pg";

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
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)
  ) {
    throw new Error(
      "TEST_DATABASE_URL must use a test database and explicit non-public schema",
    );
  }
  url.searchParams.delete("schema");
  return { connectionString: url.toString(), schema };
}

const { connectionString, schema } = testTarget();
const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`);
  await client.query(`CREATE SCHEMA ${quote(schema)}`);
  await client.query(`SET search_path TO ${quote(schema)}, public`);
  await client.query(
    "CREATE TABLE model_proxy_benchmarks (id text PRIMARY KEY)",
  );
  await client.query(
    "INSERT INTO model_proxy_benchmarks (id) VALUES ('legacy-sentinel')",
  );
  const [forward, down, fresh] = await Promise.all([
    readFile(
      new URL("../drizzle/0009_dusty_jigsaw.sql", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../drizzle/0009_dusty_jigsaw.down.sql", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../drizzle-fresh/0000_clean-model-proxy-baseline.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  // A full legacy migration chain is owned by the normal migrator. This proof
  // focuses on the additive objects, their reversible down SQL, and baseline.
  await client.query(forward.replaceAll('"public".', ""));
  await client.query(
    "INSERT INTO benchmark_snapshots (catalog, source_label, source_url, fetched_at, count) VALUES ($1, $2, $3, now(), $4)",
    ["artificial-analysis", "AA", "https://example.test", 0],
  );
  await client.query(down);
  const missing = await client.query(
    "SELECT to_regclass('benchmark_snapshots') AS snapshot, to_regclass('benchmark_snapshot_entries') AS entry",
  );
  if (missing.rows[0].snapshot || missing.rows[0].entry)
    throw new Error("down migration did not remove benchmark snapshot tables");
  const sentinel = await client.query(
    "SELECT id FROM model_proxy_benchmarks WHERE id = 'legacy-sentinel'",
  );
  if (sentinel.rowCount !== 1)
    throw new Error("down migration removed legacy benchmark data");
  await client.query(`DROP SCHEMA ${quote(schema)} CASCADE`);
  await client.query(`CREATE SCHEMA ${quote(schema)}`);
  await client.query(`SET search_path TO ${quote(schema)}, public`);
  await client.query(fresh.replaceAll('"public".', ""));
  const baseline = await client.query(
    "SELECT to_regclass('benchmark_snapshots') AS snapshot, to_regclass('benchmark_snapshot_entries') AS entry",
  );
  if (!baseline.rows[0].snapshot || !baseline.rows[0].entry)
    throw new Error("fresh baseline is missing benchmark snapshot tables");
} finally {
  await client.end();
}
