import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";

export function prepareBackupConfigTask(ctx: BackupContext): void {
  const config = getRequiredConfig(ctx);
  const { dbName, host, retentionDays, backupDir } = config;

  console.log("Starting PostgreSQL backup...");
  console.log(`  Database: ${dbName}`);
  console.log(`  Host: ${host}`);
  console.log(`  Retention: ${retentionDays} days`);
  console.log(`  Output: ${backupDir}`);
}
