import { execSync, spawn } from "node:child_process";
import { createWriteStream, readdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
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

  if (config.dumpFormat === "directory") {
    await runParallelDirectoryDump(task, config, estimatedSizeBytes);
  } else {
    await runCustomDump(task, config, estimatedSizeBytes);
  }

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

async function runCustomDump(
  task: ListrTaskLike,
  config: BackupContext["config"] extends infer T ? NonNullable<T> : never,
  estimatedSizeBytes: number | undefined,
): Promise<void> {
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
      "-Z",
      String(config.compressLevel),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
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

  const { stream: progressStream, close: closeProgress } = createProgressStream(
    task,
    estimatedSizeBytes,
  );

  if (!dump.stdout) {
    throw new Error("Failed to capture pg_dump output stream.");
  }

  const outputFile = createWriteStream(config.backupFile);
  const dumpExit = waitForExit(dump, () => {
    const trailing = stderrBuffer.trim();
    if (trailing && !isPodmanHint(trailing)) {
      stderrLines.push(trailing);
    }
    return stderrLines.at(-1);
  });

  await (config.gzipEnabled
    ? pipeline(
        dump.stdout,
        progressStream,
        createGzip({ level: 1 }),
        outputFile,
      )
    : pipeline(dump.stdout, progressStream, outputFile)
  ).finally(() => {
    closeProgress();
  });

  await dumpExit;
}

async function runParallelDirectoryDump(
  task: ListrTaskLike,
  config: BackupContext["config"] extends infer T ? NonNullable<T> : never,
  estimatedSizeBytes: number | undefined,
): Promise<void> {
  const dumpDir = `${config.backupFile}.tmpdir`;
  rmSync(dumpDir, { recursive: true, force: true });

  const dump = spawn(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "host",
      "-v",
      `${config.backupDir}:${config.backupDir}`,
      config.pgDumpImage,
      "pg_dump",
      config.databaseUrl,
      "-Fd",
      "-f",
      dumpDir,
      "-j",
      String(config.parallelJobs),
      "-Z",
      String(config.compressLevel),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
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

  const speedSamples = Array<number>(20).fill(1);
  let speedSampleIndex = 0;
  let lastBytes = 0;
  let lastTickTime = Date.now();
  const startedAt = Date.now();

  const interval = setInterval(() => {
    const bytes = getDirectorySize(dumpDir);
    if (bytes <= 0) {
      return;
    }
    const now = Date.now();
    const elapsedSeconds = Math.max((now - lastTickTime) / 1000, 0.001);
    const deltaBytes = Math.max(0, bytes - lastBytes);
    const speedBytes = deltaBytes / elapsedSeconds;
    speedSamples[speedSampleIndex] = Math.max(1, speedBytes);
    speedSampleIndex = (speedSampleIndex + 1) % speedSamples.length;
    const averageSpeedBytes =
      speedSamples.reduce((sum, value) => sum + value, 0) / speedSamples.length;

    const transferred = formatBytes(bytes);
    if (estimatedSizeBytes) {
      const adjustedTotalBytes = Math.max(estimatedSizeBytes, bytes);
      const pct = Math.min(100, (bytes / adjustedTotalBytes) * 100);
      const remaining = Math.max(adjustedTotalBytes - bytes, 0);
      const etaSeconds =
        averageSpeedBytes > 0 ? Math.ceil(remaining / averageSpeedBytes) : 0;
      task.output = formatProgressLine({
        startedAt,
        percentage: pct,
        transferredBytes: bytes,
        totalBytes: adjustedTotalBytes,
        speedBytes: averageSpeedBytes,
        etaSeconds,
      });
      lastBytes = bytes;
      lastTickTime = now;
      return;
    }
    task.output = `${transferred} [directory dump]`;
    lastBytes = bytes;
    lastTickTime = now;
  }, 500);

  await waitForExit(dump, () => {
    const trailing = stderrBuffer.trim();
    if (trailing && !isPodmanHint(trailing)) {
      stderrLines.push(trailing);
    }
    return stderrLines.at(-1);
  }).finally(() => {
    clearInterval(interval);
  });

  await packDirectoryDump(
    dumpDir,
    config.backupFile,
    config.gzipEnabled,
    config.parallelJobs,
    task,
  );
  rmSync(dumpDir, { recursive: true, force: true });
}

async function packDirectoryDump(
  dumpDir: string,
  backupFile: string,
  gzipEnabled: boolean,
  parallelJobs: number,
  task: ListrTaskLike,
): Promise<void> {
  const estimatedTotalBytes = Math.max(1, getDirectorySize(dumpDir));
  const canUsePigz = gzipEnabled && isCommandAvailable("pigz");
  task.output = gzipEnabled
    ? canUsePigz
      ? `Packaging parallel dump (.tar.gz) with pigz (${parallelJobs} threads)...`
      : "Packaging parallel dump (.tar.gz)..."
    : "Packaging parallel dump (.tar)...";
  if (gzipEnabled && !canUsePigz) {
    console.log(
      "Warning: `pigz` not found. Install it for faster parallel packing " +
        "(Ubuntu/Debian: `sudo apt install pigz`, macOS: `brew install pigz`).",
    );
  }

  const parentDir = dirname(dumpDir);
  const dirName = basename(dumpDir);
  const tar = canUsePigz
    ? spawn(
        "bash",
        [
          "-o",
          "pipefail",
          "-c",
          `tar -cf - -C "${parentDir}" "${dirName}" | pigz -p ${parallelJobs} > "${backupFile}"`,
        ],
        { stdio: ["ignore", "ignore", "pipe"] },
      )
    : spawn(
        "tar",
        gzipEnabled
          ? ["-czf", backupFile, "-C", parentDir, dirName]
          : ["-cf", backupFile, "-C", parentDir, dirName],
        { stdio: ["ignore", "ignore", "pipe"] },
      );

  let lastError = "";
  const speedSamples = Array<number>(20).fill(1);
  let speedSampleIndex = 0;
  let lastBytes = 0;
  let lastTickTime = Date.now();
  const startedAt = Date.now();

  const interval = setInterval(() => {
    const currentBytes = getFileSize(backupFile);
    if (currentBytes <= 0) {
      return;
    }
    const now = Date.now();
    const elapsedSeconds = Math.max((now - lastTickTime) / 1000, 0.001);
    const deltaBytes = Math.max(0, currentBytes - lastBytes);
    const speedBytes = deltaBytes / elapsedSeconds;
    speedSamples[speedSampleIndex] = Math.max(1, speedBytes);
    speedSampleIndex = (speedSampleIndex + 1) % speedSamples.length;
    const averageSpeedBytes =
      speedSamples.reduce((sum, value) => sum + value, 0) / speedSamples.length;
    const adjustedTotalBytes = Math.max(estimatedTotalBytes, currentBytes);
    const pct = Math.min(100, (currentBytes / adjustedTotalBytes) * 100);
    const remaining = Math.max(adjustedTotalBytes - currentBytes, 0);
    const etaSeconds =
      averageSpeedBytes > 0 ? Math.ceil(remaining / averageSpeedBytes) : 0;

    task.output = `Packing | ${formatProgressLine({
      startedAt,
      percentage: pct,
      transferredBytes: currentBytes,
      totalBytes: adjustedTotalBytes,
      speedBytes: averageSpeedBytes,
      etaSeconds,
    })}`;

    lastBytes = currentBytes;
    lastTickTime = now;
  }, 500);

  tar.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8").trim();
    if (text) {
      lastError = text;
    }
  });
  await waitForExit(tar, () => lastError || undefined).finally(() => {
    clearInterval(interval);
  });
}

function waitForExit(
  process: ReturnType<typeof spawn>,
  getLastError: () => string | undefined,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    process.once("error", (error) => reject(error));
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

function isPodmanHint(message: string): boolean {
  return message.startsWith("Emulate Docker CLI using podman.");
}

function createProgressStream(
  task: ListrTaskLike,
  estimatedSizeBytes: number | undefined,
): { stream: Transform; close: () => void } {
  let transferredBytes = 0;
  let lastTickTime = Date.now();
  let lastTickBytes = 0;
  const speedSamples = Array<number>(20).fill(1);
  let speedSampleIndex = 0;
  const startedAt = Date.now();

  const stream = new Transform({
    transform(chunk, _encoding, callback) {
      transferredBytes += chunk.length;
      const now = Date.now();
      const elapsedSeconds = Math.max((now - lastTickTime) / 1000, 0.001);
      const deltaBytes = transferredBytes - lastTickBytes;
      const speedBytes = deltaBytes / elapsedSeconds;
      speedSamples[speedSampleIndex] = Math.max(1, speedBytes);
      speedSampleIndex = (speedSampleIndex + 1) % speedSamples.length;
      const averageSpeedBytes =
        speedSamples.reduce((sum, value) => sum + value, 0) /
        speedSamples.length;

      if (estimatedSizeBytes) {
        const adjustedTotalBytes = Math.max(
          estimatedSizeBytes,
          transferredBytes,
        );
        const remaining = Math.max(adjustedTotalBytes - transferredBytes, 0);
        const etaSeconds =
          averageSpeedBytes > 0 ? Math.ceil(remaining / averageSpeedBytes) : 0;
        const pct = Math.min(
          100,
          (transferredBytes / adjustedTotalBytes) * 100,
        );
        task.output = formatProgressLine({
          startedAt,
          percentage: pct,
          transferredBytes,
          totalBytes: adjustedTotalBytes,
          speedBytes: averageSpeedBytes,
          etaSeconds,
        });
      } else {
        const transferred = formatBytes(transferredBytes);
        const speed = formatBytes(averageSpeedBytes);
        task.output = `${transferred} ${speed}/s`;
      }

      lastTickTime = now;
      lastTickBytes = transferredBytes;
      callback(null, chunk);
    },
  });

  return {
    stream,
    close: () => {},
  };
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

function getDirectorySize(path: string): number {
  try {
    const stats = statSync(path);
    if (!stats.isDirectory()) {
      return stats.size;
    }
  } catch {
    return 0;
  }

  let size = 0;
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    try {
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        size += getDirectorySize(fullPath);
      } else {
        size += stats.size;
      }
    } catch {
      // Ignore transient file errors.
    }
  }
  return size;
}

function getFileSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function isCommandAvailable(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function renderBar(percentage: number, size: number): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clamped / 100) * size);
  return `${"=".repeat(filled)}${"-".repeat(Math.max(0, size - filled))}`;
}

function formatProgressLine(params: {
  startedAt: number;
  percentage: number;
  transferredBytes: number;
  totalBytes: number;
  speedBytes: number;
  etaSeconds: number;
}): string {
  const elapsed = formatEta((Date.now() - params.startedAt) / 1000);
  const bar = renderBar(params.percentage, 24);
  const transferred = formatBytes(params.transferredBytes);
  const total = formatBytes(params.totalBytes);
  const speed = formatBytes(params.speedBytes);
  return `${elapsed} [${bar}] ${params.percentage.toFixed(1)}% | ${transferred} of ${total} | ${speed}/s | ETA ${formatEta(params.etaSeconds)}`;
}
