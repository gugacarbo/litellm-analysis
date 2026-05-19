import { execSync, spawn } from "node:child_process";
import { createWriteStream, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import type { Progress } from "progress-stream";
import progress from "progress-stream";
import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";
import { formatBytes } from "../utils/format-bytes";

interface ListrTaskLike {
  output: string;
}

export async function runPgDumpTask(
  ctx: BackupContext,
  task: ListrTaskLike,
): Promise<void> {
  const config = getRequiredConfig(ctx);
  const estimatedSizeBytes = getDatabaseSizeBytes(
    config.pgDumpImage,
    config.databaseUrl,
  );

  task.output = estimatedSizeBytes
    ? `Progress enabled (${formatBytes(estimatedSizeBytes)} estimated)`
    : "Progress enabled (size estimate unavailable)";

  const dump = spawn(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "host",
      config.pgDumpImage,
      "pg_dump",
      config.databaseUrl,
      "-Fc",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const stderrLines: string[] = [];
  let stderrBuffer = "";

  dump.stderr.on("data", (chunk: Buffer) => {
    stderrBuffer += chunk.toString("utf8");
    const parts = stderrBuffer.split(/\r|\n/);
    stderrBuffer = parts.pop() ?? "";

    for (const part of parts) {
      const message = part.trim();
      if (!message || isPodmanHint(message)) {
        continue;
      }
      stderrLines.push(message);
      task.output = message;
    }
  });

  const progressStream = progress({
    length: estimatedSizeBytes,
    time: 500,
  });

  progressStream.on("progress", (status: Progress) => {
    const transferred = formatBytes(status.transferred);
    const speed = formatBytes(status.speed);
    if (typeof status.percentage === "number" && Number.isFinite(status.eta)) {
      const percentage = `${status.percentage.toFixed(1)}%`;
      const eta = formatEta(status.eta);
      task.output = `${percentage} ${transferred} ${speed}/s ETA ${eta}`;
      return;
    }
    task.output = `${transferred} ${speed}/s`;
  });

  const gzip = createGzip();
  const outputFile = createWriteStream(config.backupFile);

  if (!dump.stdout) {
    throw new Error("Failed to capture pg_dump output stream.");
  }

  const dumpExit = waitForExit(dump, () => {
    const trailing = stderrBuffer.trim();
    if (trailing && !isPodmanHint(trailing)) {
      stderrLines.push(trailing);
    }
    return stderrLines.at(-1);
  });

  await pipeline(dump.stdout, progressStream, gzip, outputFile);
  await dumpExit;

  const fileSize = formatBytes(statSync(config.backupFile).size);
  task.output = `Backup created: ${config.backupFile} (${fileSize})`;
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

function waitForExit(
  process: ReturnType<typeof spawn>,
  getLastError: () => string | undefined,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    process.once("error", (error) => {
      reject(error);
    });
    process.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(getLastError() ?? `pg_dump failed with exit code ${code}`),
      );
    });
  });
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }

  const totalSeconds = Math.ceil(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function isPodmanHint(message: string): boolean {
  return message.startsWith("Emulate Docker CLI using podman.");
}
