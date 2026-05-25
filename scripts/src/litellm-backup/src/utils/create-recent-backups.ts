import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { buildBackupPattern } from "./build-backup-pattern";

export function createRecentBackups(
  backupDir: string,
  dbName: string,
  limit: number,
): string[] {
  const pattern = buildBackupPattern(dbName);

  if (!existsSync(backupDir)) {
    return [];
  }

  const backups: string[] = [];
  const files = readdirSync(backupDir).sort().reverse();

  for (const file of files) {
    if (!pattern.test(file)) {
      continue;
    }

    const filePath = join(backupDir, file);

    try {
      if (statSync(filePath).isFile()) {
        backups.push(file);
      }
    } catch {
      // Ignore unreadable files.
    }

    if (backups.length === limit) {
      break;
    }
  }

  return backups;
}
