import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";

export function prepareBackupConfigTask(ctx: BackupContext): void {
  const config = getRequiredConfig(ctx);
  const { dbName, host, retentionDays, backupDir, jobs, compressLevel } =
    config;

  console.log("Starting PostgreSQL backup...");
  console.log(`  Database: ${dbName}`);
  console.log(`  Host: ${host}`);
  console.log(`  Retention: ${retentionDays} days`);
  console.log(`  Output: ${backupDir}`);
  if (config.fastMode) {
    console.log("  Mode: FAST");
  }
  console.log(`  Format: ${config.dumpFormat}`);
  console.log(`  Parallel jobs: ${config.parallelJobs}`);
  console.log(`  Jobs: ${jobs}`);
  console.log(`  pg_dump compression: ${compressLevel}`);
  console.log(`  Gzip: ${config.gzipEnabled ? "enabled" : "disabled"}`);
}
