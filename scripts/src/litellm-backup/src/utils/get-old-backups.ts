import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { buildBackupPattern } from "./build-backup-pattern";

export function getOldBackups(
  backupDir: string,
  dbName: string,
  retentionDays: number,
): string[] {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const pattern = buildBackupPattern(dbName);

  if (!existsSync(backupDir)) {
    return [];
  }

  const oldBackups: string[] = [];
  const files = readdirSync(backupDir);

  for (const file of files) {
    if (!pattern.test(file)) {
      continue;
    }

    const filePath = join(backupDir, file);

    try {
      if (statSync(filePath).mtimeMs < cutoffTime) {
        oldBackups.push(filePath);
      }
    } catch {
      // Ignore unreadable files.
    }
  }

  return oldBackups;
}
