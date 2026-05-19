#!/usr/bin/env node

/**
 * LiteLLM PostgreSQL Backup Script
 * Creates compressed SQL dumps with configurable retention
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." pnpm backup
 *   BACKUP_DIR="./backups" RETENTION_DAYS=14 pnpm backup
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

interface CliOptions {
  retention: number;
  outputDir: string;
  help: boolean;
}

function parseCliArgs(): CliOptions {
  const { values } = parseArgs({
    options: {
      retention: { type: "string", short: "r", default: "7" },
      "output-dir": { type: "string", short: "o", default: "./backups" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  return {
    retention: parseInt(values.retention as string, 10),
    outputDir: values["output-dir"] as string,
    help: values.help as boolean,
  };
}

function showHelp(): void {
  console.log(`
LiteLLM PostgreSQL Backup Script

Usage:
  DATABASE_URL="postgresql://..." pnpm backup [options]

Options:
  -r, --retention <days>    Number of days to retain backups (default: 7)
  -o, --output-dir <dir>    Backup output directory (default: ./backups)
  -h, --help                Show this help message

Environment Variables:
  DATABASE_URL    PostgreSQL connection string (required)

Examples:
  DATABASE_URL="postgresql://user:pass@localhost:5432/litellm" pnpm backup
  RETENTION_DAYS=14 pnpm backup -o ./backups
`);
}

function extractDbName(databaseUrl: string): string {
  const match = databaseUrl.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : "unknown";
}

function extractHost(databaseUrl: string): string {
  const match = databaseUrl.match(/@([^:]+):/);
  return match ? match[1] : "unknown";
}

function getOldBackups(
  backupDir: string,
  dbName: string,
  retentionDays: number,
): string[] {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const pattern = new RegExp(`^litellm_${dbName}_\\d{8}_\\d{6}\\.sql\\.gz$`);

  if (!existsSync(backupDir)) return [];

  return readdirSync(backupDir)
    .filter((file) => pattern.test(file))
    .map((file) => join(backupDir, file))
    .filter((filePath) => {
      try {
        return statSync(filePath).mtimeMs < cutoffTime;
      } catch {
        return false;
      }
    });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}

async function main(): Promise<void> {
  const options = parseCliArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL;
  const retentionDays =
    parseInt(process.env.RETENTION_DAYS ?? "", 10) || options.retention;
  const backupDir = process.env.BACKUP_DIR ?? options.outputDir;

  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is not set");
    console.error("\nUsage: DATABASE_URL='postgresql://...' pnpm backup");
    console.error("       pnpm backup --help for all options");
    process.exit(1);
  }

  const dbName = extractDbName(databaseUrl);
  const host = extractHost(databaseUrl);
  const timestamp = new Date()
    .toISOString()
    .replace(/[:-]/g, "")
    .replace("T", "_")
    .slice(0, 15);

  console.log("Starting PostgreSQL backup...");
  console.log(`  Database: ${dbName}`);
  console.log(`  Host: ${host}`);
  console.log(`  Retention: ${retentionDays} days`);
  console.log(`  Output: ${backupDir}`);

  mkdirSync(backupDir, { recursive: true });

  const backupFile = join(backupDir, `litellm_${dbName}_${timestamp}.sql.gz`);

  try {
    console.log("\nRunning pg_dump...");
    execSync(`pg_dump "${databaseUrl}" -Fc -j 4 | gzip > "${backupFile}"`, {
      stdio: "inherit",
    });

    const fileSize = formatBytes(statSync(backupFile).size);
    console.log(`\nBackup created: ${backupFile} (${fileSize})`);
  } catch (error) {
    console.error("\nBackup failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log(`\nCleaning up backups older than ${retentionDays} days...`);
  const oldBackups = getOldBackups(backupDir, dbName, retentionDays);
  let removedCount = 0;

  for (const backup of oldBackups) {
    try {
      unlinkSync(backup);
      removedCount++;
      console.log(`  Removed: ${backup}`);
    } catch {
      // Ignore removal errors
    }
  }

  if (removedCount > 0) {
    console.log(`Removed ${removedCount} old backup(s)`);
  } else {
    console.log("No old backups to remove");
  }

  console.log("\nRecent backups:");
  const pattern = new RegExp(`^litellm_${dbName}_\\d{8}_\\d{6}\\.sql\\.gz$`);
  const backups = readdirSync(backupDir)
    .filter((file) => pattern.test(file))
    .sort()
    .reverse()
    .slice(0, 5);

  if (backups.length === 0) {
    console.log("  No backups found");
  } else {
    for (const backup of backups) {
      const fullPath = join(backupDir, backup);
      const size = formatBytes(statSync(fullPath).size);
      console.log(`  ${size.padEnd(6)} ${backup}`);
    }
  }

  console.log("\nBackup complete!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
