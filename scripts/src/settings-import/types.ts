export interface ImportFlags {
  dryRun: boolean;
  force: boolean;
  skipMissingModels: boolean;
  createStubs: boolean;
}

interface ImportCounters {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface ImportSummary {
  agents: ImportCounters;
  plugins: ImportCounters;
  models: ImportCounters;
  providers: ImportCounters;
  settings: ImportCounters;
  warnings: string[];
  requiredEnvVars: Array<{
    provider: string;
    secretRef: string;
    action: string;
  }>;
}

export function createEmptySummary(): ImportSummary {
  return {
    agents: { inserted: 0, updated: 0, skipped: 0 },
    plugins: { inserted: 0, updated: 0, skipped: 0 },
    models: { inserted: 0, updated: 0, skipped: 0 },
    providers: { inserted: 0, updated: 0, skipped: 0 },
    settings: { inserted: 0, updated: 0, skipped: 0 },
    warnings: [],
    requiredEnvVars: [],
  };
}

export function parseImportFlags(args: string[]): ImportFlags {
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    skipMissingModels: args.includes("--skip-missing-models"),
    createStubs: args.includes("--create-stubs"),
  };
}

export function printImportHelp(): void {
  console.log(`Usage: pnpm settings:import [options]

Import @settings agents, plugins, and models into model_proxy_* PostgreSQL.

Options:
  --dry-run              Log actions without writing to the database
  --force                Overwrite existing rows matched by natural key
  --skip-missing-models  Warn only when agents reference models absent from models.jsonc
  --create-stubs         Create minimal model_proxy_models rows for missing agent models
  --help                 Show this help message
`);
}
