import type { ImportLegacyOptions, ImportPhase } from "./import-summary.js";

const ALL_PHASES: ImportPhase[] = ["credentials", "settings", "models"];

function parseOnly(value: string | undefined): Set<ImportPhase> {
  if (!value) {
    return new Set(ALL_PHASES);
  }

  const phases = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const valid = new Set<ImportPhase>();
  for (const phase of phases) {
    if (phase === "settings" || phase === "credentials" || phase === "models") {
      valid.add(phase);
      continue;
    }

    throw new Error(
      `Invalid --only value "${phase}". Expected settings, credentials, or models.`,
    );
  }

  if (valid.size === 0) {
    throw new Error("--only must include at least one phase.");
  }

  return valid;
}

export function parseImportCliArgs(argv: string[]): ImportLegacyOptions {
  let dryRun = false;
  let force = false;
  let allowLegacyApiKey = false;
  let onlyValue: string | undefined;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--allow-legacy-api-key") {
      allowLegacyApiKey = true;
      continue;
    }

    if (arg.startsWith("--only=")) {
      onlyValue = arg.slice("--only=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printImportHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    dryRun,
    force,
    only: parseOnly(onlyValue),
    allowLegacyApiKey,
  };
}

export function printImportHelp(): void {
  console.log(`
import-legacy-registry — one-shot LiteLLM → model_proxy_* migration

Usage:
  pnpm model-proxy:import-legacy [--dry-run] [--force] [--only=settings,credentials,models]

Flags:
  --dry-run                 Log actions without writing to model_proxy_*
  --force                   Update existing rows matched by natural key
  --only=<phases>           Restrict import phases (comma-separated)
  --allow-legacy-api-key    Copy legacy api_key into model_proxy_credentials (discouraged)

Environment:
  MODEL_PROXY_DATABASE_URL  Target model_proxy_* database (required)
  DB_* or DATABASE_URL      LiteLLM source database (required)
`);
}
