export interface CliOptions {
  retention: number;
  outputDir: string;
  fast: boolean;
  noGzip: boolean;
  parallel: number;
  jobs: number;
  compressLevel: number;
  help: boolean;
}

export interface BackupConfig {
  databaseUrl: string;
  retentionDays: number;
  backupDir: string;
  pgDumpImage: string;
  dbName: string;
  host: string;
  timestamp: string;
  backupFile: string;
  fastMode: boolean;
  parallelJobs: number;
  dumpFormat: "custom" | "directory";
  gzipEnabled: boolean;
  jobs: number;
  compressLevel: number;
}

export interface BackupContext {
  config?: BackupConfig;
  removedCount?: number;
  recentBackups?: string[];
}
