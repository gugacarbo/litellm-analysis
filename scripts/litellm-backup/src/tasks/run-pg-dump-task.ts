import { execSync } from "node:child_process";
import { statSync } from "node:fs";
import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";
import { formatBytes } from "../utils/format-bytes";

export function runPgDumpTask(ctx: BackupContext): void {
  const config = getRequiredConfig(ctx);
  const hasPv = isCommandAvailable("pv");
  const databaseSizeBytes = hasPv
    ? getDatabaseSizeBytes(config.pgDumpImage, config.databaseUrl)
    : undefined;
  const pvCommand = hasPv
    ? databaseSizeBytes
      ? `pv -s ${databaseSizeBytes}`
      : "pv"
    : undefined;
  const progressPipe = pvCommand ? ` | ${pvCommand}` : "";

  if (hasPv) {
    if (databaseSizeBytes) {
      console.log(
        `\nProgress enabled (estimated size: ${formatBytes(databaseSizeBytes)})`,
      );
    } else {
      console.log("\nProgress enabled (size estimate unavailable)");
    }
  } else {
    console.log("\nProgress disabled (install `pv` to enable progress bar)");
  }

  execSync(
    `bash -o pipefail -c 'docker run --rm --network host ${config.pgDumpImage} ` +
      `pg_dump "${config.databaseUrl}" -Fc ` +
      `${progressPipe} | gzip > "${config.backupFile}"'`,
    { stdio: "inherit" },
  );

  const fileSize = formatBytes(statSync(config.backupFile).size);
  console.log(`\nBackup created: ${config.backupFile} (${fileSize})`);
}

function isCommandAvailable(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getDatabaseSizeBytes(
  image: string,
  databaseUrl: string,
): number | undefined {
  try {
    const output = execSync(
      `docker run --rm --network host ${image} ` +
        `psql "${databaseUrl}" -Atc "SELECT pg_database_size(current_database())"`,
      { stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    const parsed = Number.parseInt(output, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}
