import { existsSync, unlinkSync } from "node:fs";

import { buildBackupConfig } from "../config/build-backup-config";
import { createBackupPipeline } from "../pipeline/create-backup-pipeline";
import { parseCliArgs } from "./parse-cli-args";
import { showHelp } from "./show-help";

export async function runBackup(): Promise<void> {
  const options = parseCliArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const initialConfig = buildBackupConfig(options);

  try {
    await createBackupPipeline(initialConfig).run();
  } catch (error) {
    if (existsSync(initialConfig.backupFile)) {
      try {
        unlinkSync(initialConfig.backupFile);
      } catch {
        // Best effort cleanup.
      }
    }

    console.error(
      "\nBackup failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}
