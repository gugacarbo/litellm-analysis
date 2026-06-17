import type {
  HistoryImportOptions,
  HistoryImportPhase,
} from "./history-import-summary.js";

const ALL_PHASES: HistoryImportPhase[] = ["spend", "errors"];

function parseOnly(value: string | undefined): Set<HistoryImportPhase> {
  if (!value) {
    return new Set(ALL_PHASES);
  }

  const phases = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const valid = new Set<HistoryImportPhase>();
  for (const phase of phases) {
    if (phase === "spend" || phase === "errors") {
      valid.add(phase);
      continue;
    }

    throw new Error(
      `Invalid --only value "${phase}". Expected spend or errors.`,
    );
  }

  if (valid.size === 0) {
    throw new Error("--only must include at least one phase.");
  }

  return valid;
}

export function parseHistoryImportCliArgs(
  argv: string[],
): HistoryImportOptions {
  let dryRun = false;
  let force = false;
  let onlyValue: string | undefined;
  let batchSize = 500;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg.startsWith("--only=")) {
      onlyValue = arg.slice("--only=".length);
      continue;
    }

    if (arg === "--only" && index + 1 < argv.length) {
      onlyValue = argv[++index];
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const parsed = Number.parseInt(arg.slice("--batch-size=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        batchSize = parsed;
      }
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHistoryImportHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    dryRun,
    force,
    only: parseOnly(onlyValue),
    batchSize,
  };
}

export function printHistoryImportHelp(): void {
  console.log(`
import-history — LiteLLM spend/error logs → model_proxy_requests

Usage:
  pnpm model-proxy:import-history [--dry-run] [--force] [--only=spend,errors]

Flags:
  --dry-run                 Log actions without writing to model_proxy_*
  --force                   Update existing rows created by prior imports
  --only=<phases>           Restrict import phases (spend, errors)
  --batch-size=<n>          Rows per batch (default: 500)

Environment:
  MODEL_PROXY_DATABASE_URL  Target model_proxy_* database (required)
  DB_* or DATABASE_URL      LiteLLM source database (required)
`);
}
