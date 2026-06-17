#!/usr/bin/env tsx
import {
  parseHistoryImportCliArgs,
  printHistoryImportHelp,
} from "../src/import/parse-history-cli-args.js";
import {
  printHistoryImportSummary,
  runHistoryImport,
} from "../src/import/run-history-import.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHistoryImportHelp();
    process.exit(1);
  }

  const options = parseHistoryImportCliArgs(args);
  const summary = await runHistoryImport(options);
  printHistoryImportSummary(summary);

  if (summary.errors > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`History import failed: ${message}`);
  process.exit(1);
});
