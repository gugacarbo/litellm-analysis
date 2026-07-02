import { join } from "node:path";
import type { BackupConfig, CliOptions } from "../types/backup";
import { createTimestamp } from "../utils/create-timestamp";
import { extractDbName } from "../utils/extract-db-name";
import { extractHost } from "../utils/extract-host";

export function buildBackupConfig(options: CliOptions): BackupConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database backup");
  }
  const retentionDays =
    parseInt(process.env.RETENTION_DAYS ?? "", 10) || options.retention;
  const backupDir = process.env.BACKUP_DIR ?? options.outputDir;
  const pgDumpImage = process.env.PG_DUMP_IMAGE ?? "postgres:16";
  const fastMode = options.fast || process.env.BACKUP_FAST === "1";
  const requestedJobs =
    parseInt(process.env.PG_DUMP_JOBS ?? "", 10) || options.jobs;
  const parallelJobs = Math.max(
    1,
    parseInt(process.env.PG_DUMP_PARALLEL ?? "", 10) ||
      options.parallel ||
      requestedJobs,
  );
  const dumpFormat = parallelJobs > 1 ? "directory" : "custom";
  const gzipEnabled = fastMode ? false : !options.noGzip;
  const jobs = dumpFormat === "directory" ? parallelJobs : 1;
  const compressLevel = fastMode
    ? 0
    : clampCompressLevel(
        parseInt(process.env.PG_DUMP_COMPRESS_LEVEL ?? "", 10) ||
          options.compressLevel,
      );
  const dbName = extractDbName(databaseUrl);
  const host = extractHost(databaseUrl);
  const timestamp = createTimestamp();
  const extension =
    dumpFormat === "directory"
      ? gzipEnabled
        ? "dir.tar.gz"
        : "dir.tar"
      : gzipEnabled
        ? "sql.gz"
        : "dump";

  return {
    databaseUrl,
    retentionDays,
    backupDir,
    pgDumpImage,
    dbName,
    host,
    timestamp,
    backupFile: join(
      backupDir,
      `model_proxy_${dbName}_${timestamp}.${extension}`,
    ),
    fastMode,
    parallelJobs,
    dumpFormat,
    gzipEnabled,
    jobs,
    compressLevel,
  };
}

function clampCompressLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 0;
  }
  return Math.min(9, Math.max(0, level));
}
