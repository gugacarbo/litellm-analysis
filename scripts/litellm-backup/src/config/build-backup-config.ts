import { join } from "node:path";
import type { BackupConfig, CliOptions } from "../types/backup";
import { createTimestamp } from "../utils/create-timestamp";
import { extractDbName } from "../utils/extract-db-name";
import { extractHost } from "../utils/extract-host";
import { buildDatabaseUrlFromConfig } from "./build-database-url-from-config";

export function buildBackupConfig(options: CliOptions): BackupConfig {
  const databaseUrl = process.env.DATABASE_URL ?? buildDatabaseUrlFromConfig();
  const retentionDays =
    parseInt(process.env.RETENTION_DAYS ?? "", 10) || options.retention;
  const backupDir = process.env.BACKUP_DIR ?? options.outputDir;
  const pgDumpImage = process.env.PG_DUMP_IMAGE ?? "postgres:16";
  const dbName = extractDbName(databaseUrl);
  const host = extractHost(databaseUrl);
  const timestamp = createTimestamp();

  return {
    databaseUrl,
    retentionDays,
    backupDir,
    pgDumpImage,
    dbName,
    host,
    timestamp,
    backupFile: join(backupDir, `litellm_${dbName}_${timestamp}.sql.gz`),
  };
}
