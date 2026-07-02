export interface ImportFlags {
  dryRun: boolean;
  force: boolean;
}

interface ImportCounters {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface ImportSummary {
  agents: ImportCounters;
  plugins: ImportCounters;
  warnings: string[];
}

export function createEmptySummary(): ImportSummary {
  return {
    agents: { inserted: 0, updated: 0, skipped: 0 },
    plugins: { inserted: 0, updated: 0, skipped: 0 },
    warnings: [],
  };
}

export function parseImportFlags(args: string[]): ImportFlags {
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
  };
}

export function printImportHelp(): void {
  console.log(`Usage: pnpm settings:import [options]

Import @settings agents and plugins into PostgreSQL-backed dashboard settings.

Options:
  --dry-run              Log actions without writing to the database
  --force                Overwrite existing rows matched by natural key
  --help                 Show this help message
`);
}
