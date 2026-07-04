import { existsSync } from "node:fs";
import path from "node:path";
import type {
  BenchmarkSyncStatus,
  BenchmarkSyncStatusResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts/benchmarks";
import { fetchAndPersistBenchmarks } from "./benchmark-fetcher";

const MAX_ERROR_LENGTH = 1_000;

type BenchmarkSyncRunner = (options: {
  apiKey: string;
  outputDir: string;
}) => Promise<void>;

export interface BenchmarkSyncApplicationServiceOptions {
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
    this.outputDir = options.outputDir;
    this.datasetFilePath = options.datasetFilePath;
    this.artificialAnalysisApiKey = options.artificialAnalysisApiKey;
    this.runner = options.runner ?? runSyncInProcess;
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

    this.inFlight = this.runner({
      apiKey,
      outputDir: this.outputDir,
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

async function runSyncInProcess(options: {
  apiKey: string;
  outputDir: string;
}): Promise<void> {
  await fetchAndPersistBenchmarks({
    apiKey: options.apiKey,
    outputDir: options.outputDir,
  });
}

function normalizeError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error);

  return message.length > MAX_ERROR_LENGTH
    ? `${message.slice(0, MAX_ERROR_LENGTH)}...`
    : message;
}

export function createBenchmarkSyncApplicationService(options: {
  storagePath: string;
  artificialAnalysisApiKey?: string;
  runner?: BenchmarkSyncRunner;
}): BenchmarkSyncApplicationService {
  const outputDir = path.join(options.storagePath, "benchmarks");
  return new BenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
    artificialAnalysisApiKey: options.artificialAnalysisApiKey,
    runner: options.runner,
  });
}
