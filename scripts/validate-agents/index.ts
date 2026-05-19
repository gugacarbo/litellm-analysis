import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Options {
  strict: boolean;
}

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const settingsPath = process.env.SETTINGS_PATH ?? "@settings";
  const settingsRoot = path.isAbsolute(settingsPath)
    ? settingsPath
    : path.resolve(rootDir, settingsPath);

  const schemaPath = path.join(settingsRoot, "agents", "agents.schema.json");
  const dataPath = path.join(settingsRoot, "agents", "agents.jsonc");

  const args = [
    "validate",
    "--spec=draft2020",
    "-s",
    schemaPath,
    "-d",
    dataPath,
  ];
  if (options.strict) {
    args.push("--strict=true");
  }

  const result = spawnSync("ajv", args, {
    cwd: rootDir,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function parseOptions(args: string[]): Options {
  let strict = false;

  for (const arg of args) {
    if (arg === "--strict" || arg === "--all") {
      strict = true;
    } else if (arg === "--no-strict") {
      strict = false;
    } else if (arg.startsWith("--strict=")) {
      strict = parseBoolean(arg.slice("--strict=".length));
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return { strict };
}

function parseBoolean(value: string): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  console.error(`Invalid boolean value: ${value}`);
  process.exit(1);
}

void main();
