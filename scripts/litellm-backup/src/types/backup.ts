export interface CliOptions {
  retention: number;
  outputDir: string;
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
}

export interface BackupContext {
  config?: BackupConfig;
  removedCount?: number;
  recentBackups?: string[];
}
