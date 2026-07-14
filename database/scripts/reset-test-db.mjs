import { spawn } from "node:child_process";
import process from "node:process";
import pg from "pg";

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function readTestDatabaseUrl() {
  const value = process.env.TEST_DATABASE_URL?.trim();
  if (!value) {
    throw new Error("TEST_DATABASE_URL is required to reset the test database");
  }

  const url = new URL(value);
  const databaseName = url.pathname.slice(1);
  if (!/(?:^|[-_])test(?:$|[-_])/.test(databaseName)) {
    throw new Error(
      "TEST_DATABASE_URL must target a database whose name contains a standalone test marker",
    );
  }

  const schema = url.searchParams.get("schema")?.trim();
  if (
    !schema ||
    schema === "public" ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)
  ) {
    throw new Error(
      "TEST_DATABASE_URL must target a valid explicit non-public schema before reset",
    );
  }

  url.searchParams.delete("schema");
  return { connectionString: url.toString(), schema };
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited from signal ${signal}`));
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

const { connectionString, schema } = readTestDatabaseUrl();
const client = new pg.Client({ connectionString });

await client.connect();
try {
  await client.query(
    `DROP SCHEMA IF EXISTS ${quoteIdentifier(schema)} CASCADE`,
  );
  await client.query(`CREATE SCHEMA ${quoteIdentifier(schema)}`);
} finally {
  await client.end();
}

await run("pnpm", ["exec", "drizzle-kit", "push", "--force"], {
  ...process.env,
  DATABASE_URL: connectionString,
  PGOPTIONS: `-c search_path=${schema},public`,
});
