#!/usr/bin/env tsx
import {
  parseImportCliArgs,
  printImportHelp,
} from "../src/import/parse-cli-args.js";
import {
  printImportSummary,
  runLegacyImport,
} from "../src/import/run-legacy-import.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printImportHelp();
    process.exit(1);
  }

  const options = parseImportCliArgs(args);
  const summary = await runLegacyImport(options);
  printImportSummary(summary);

  if (summary.errors > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Import failed: ${message}`);
  process.exit(1);
});
