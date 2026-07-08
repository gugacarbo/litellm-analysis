import { spawn } from "node:child_process";

function readSchemaFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl?.trim()) {
    return null;
  }

  try {
    const schema = new URL(databaseUrl).searchParams.get("schema")?.trim();
    return schema || null;
  } catch {
    return null;
  }
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-db-schema.mjs <command> [args...]");
  process.exit(1);
}

const env = { ...process.env };
const schema = readSchemaFromDatabaseUrl(env.DATABASE_URL);

if (schema) {
  const searchPathOption = `-c search_path=${schema},public`;
  env.PGOPTIONS = env.PGOPTIONS?.trim()
    ? `${env.PGOPTIONS} ${searchPathOption}`
    : searchPathOption;
}

const child = spawn(command, args, {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
