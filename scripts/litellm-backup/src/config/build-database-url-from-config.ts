import { getBackupDatabaseUrlFromEnv } from "../../../../packages/config/src/server";

export function buildDatabaseUrlFromConfig(): string {
  return getBackupDatabaseUrlFromEnv();
}
