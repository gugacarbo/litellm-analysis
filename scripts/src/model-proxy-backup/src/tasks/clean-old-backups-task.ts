import { unlinkSync } from "node:fs";
import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";
import { getOldBackups } from "../utils/get-old-backups";

export function cleanOldBackupsTask(ctx: BackupContext): void {
  const config = getRequiredConfig(ctx);

  console.log(
    `\nCleaning up backups older than ${config.retentionDays} days...`,
  );

  const oldBackups = getOldBackups(
    config.backupDir,
    config.dbName,
    config.retentionDays,
  );

  ctx.removedCount = 0;

  for (const backup of oldBackups) {
    try {
      unlinkSync(backup);
      ctx.removedCount++;
      console.log(`  Removed: ${backup}`);
    } catch {
      // Ignore removal errors.
    }
  }

  if (ctx.removedCount > 0) {
    console.log(`Removed ${ctx.removedCount} old backup(s)`);
  } else {
    console.log("No old backups to remove");
  }
}
