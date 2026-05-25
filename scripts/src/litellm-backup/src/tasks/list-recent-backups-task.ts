import { statSync } from "node:fs";
import { join } from "node:path";
import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";
import { createRecentBackups } from "../utils/create-recent-backups";
import { formatBytes } from "../utils/format-bytes";

export function listRecentBackupsTask(ctx: BackupContext): void {
  const config = getRequiredConfig(ctx);
  const backups = createRecentBackups(config.backupDir, config.dbName, 5);

  ctx.recentBackups = backups;

  console.log("\nRecent backups:");

  if (backups.length === 0) {
    console.log("  No backups found");
    return;
  }

  for (const backup of backups) {
    const fullPath = join(config.backupDir, backup);
    const size = formatBytes(statSync(fullPath).size);
    console.log(`  ${size.padEnd(6)} ${backup}`);
  }
}
