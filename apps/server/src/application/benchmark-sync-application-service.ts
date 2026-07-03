import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type {
  BenchmarkSyncStatus,
  BenchmarkSyncStatusResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts/benchmarks";

const execFileAsync = promisify(execFile);
const MAX_ERROR_LENGTH = 1_000;

type BenchmarkSyncRunner = (options: {
  workspaceRoot: string;
  outputDir: string;
  env: NodeJS.ProcessEnv;
}) => Promise<void>;

export interface BenchmarkSyncApplicationServiceOptions {
  workspaceRoot: string;
  outputDir: string;
  datasetFilePath: string;
  artificialAnalysisApiKey?: string;
  runner?: BenchmarkSyncRunner;
}

interface BenchmarkSyncState {
  status: BenchmarkSyncStatus;
  startedAt: string | null;
  finishedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
}

export class BenchmarkSyncConfigurationError extends Error {}

export class BenchmarkSyncApplicationService {
  private readonly workspaceRoot: string;
  private readonly outputDir: string;
  private readonly datasetFilePath: string;
  private readonly artificialAnalysisApiKey?: string;
  private readonly runner: BenchmarkSyncRunner;
  private inFlight: Promise<void> | null = null;
  private state: BenchmarkSyncState = {
    status: "idle",
    startedAt: null,
    finishedAt: null,
    lastSuccessAt: null,
    lastError: null,
  };

  constructor(options: BenchmarkSyncApplicationServiceOptions) {
    this.workspaceRoot = options.workspaceRoot;
    this.outputDir = options.outputDir;
    this.datasetFilePath = options.datasetFilePath;
    this.artificialAnalysisApiKey = options.artificialAnalysisApiKey;
    this.runner = options.runner ?? runSyncScript;
  }

  getStatus(): BenchmarkSyncStatusResponse {
    return {
      ...this.state,
      isRunning: this.state.status === "running",
      datasetExists: existsSync(this.datasetFilePath),
    };
  }

  start(): TriggerBenchmarkSyncResponse {
    if (this.inFlight) {
      return { ...this.getStatus(), triggered: false };
    }

    const apiKey = this.artificialAnalysisApiKey?.trim();
    if (!apiKey) {
      const message = "ARTIFICIAL_ANALYSIS_API_KEY is not configured";
      this.state = {
        ...this.state,
        status: "failed",
        finishedAt: new Date().toISOString(),
        lastError: message,
      };
      throw new BenchmarkSyncConfigurationError(message);
    }

    const startedAt = new Date().toISOString();
    this.state = {
      status: "running",
      startedAt,
      finishedAt: null,
      lastSuccessAt: this.state.lastSuccessAt,
      lastError: null,
    };

    const env = {
      ...process.env,
      ARTIFICIAL_ANALYSIS_API_KEY: apiKey,
      OUTPUT_DIR: this.outputDir,
    };

    this.inFlight = this.runner({
      workspaceRoot: this.workspaceRoot,
      outputDir: this.outputDir,
      env,
    })
      .then(() => {
        const finishedAt = new Date().toISOString();
        this.state = {
          status: "succeeded",
          startedAt,
          finishedAt,
          lastSuccessAt: finishedAt,
          lastError: null,
        };
      })
      .catch((error) => {
        this.state = {
          status: "failed",
          startedAt,
          finishedAt: new Date().toISOString(),
          lastSuccessAt: this.state.lastSuccessAt,
          lastError: normalizeError(error),
        };
      })
      .finally(() => {
        this.inFlight = null;
      });

    return { ...this.getStatus(), triggered: true };
  }
}

async function runSyncScript(options: {
  workspaceRoot: string;
  outputDir: string;
  env: NodeJS.ProcessEnv;
}): Promise<void> {
  await execFileAsync("pnpm", ["sync:aa-benchmarks", "--force-refresh"], {
    cwd: options.workspaceRoot,
    env: options.env,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function normalizeError(error: unknown): string {
  const maybeExecError = error as {
    message?: string;
    stderr?: string;
    stdout?: string;
  };
  const message =
    maybeExecError.stderr?.trim() ||
    maybeExecError.stdout?.trim() ||
    maybeExecError.message ||
    String(error);

  return message.length > MAX_ERROR_LENGTH
    ? `${message.slice(0, MAX_ERROR_LENGTH)}...`
    : message;
}

export function createBenchmarkSyncApplicationService(options: {
  workspaceRoot: string;
  storagePath: string;
  artificialAnalysisApiKey?: string;
  runner?: BenchmarkSyncRunner;
}): BenchmarkSyncApplicationService {
  const outputDir = path.join(options.storagePath, "benchmarks");
  return new BenchmarkSyncApplicationService({
    workspaceRoot: options.workspaceRoot,
    outputDir,
    datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
    artificialAnalysisApiKey: options.artificialAnalysisApiKey,
    runner: options.runner,
  });
}
