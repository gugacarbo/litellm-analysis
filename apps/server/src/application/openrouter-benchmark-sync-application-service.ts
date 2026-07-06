import { existsSync } from "node:fs";
import path from "node:path";
import type {
  BenchmarkSyncStatus,
  BenchmarkSyncStatusResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts/benchmarks";
import { fetchAndPersistOpenRouterBenchmarks } from "./openrouter-benchmark-fetcher";

const MAX_ERROR_LENGTH = 1_000;

type OpenRouterBenchmarkSyncRunner = (options: {
  apiKey: string;
  outputDir: string;
}) => Promise<void>;

export interface OpenRouterBenchmarkSyncApplicationServiceOptions {
  outputDir: string;
  datasetFilePath: string;
  openRouterApiKey?: string;
  runner?: OpenRouterBenchmarkSyncRunner;
}

interface OpenRouterBenchmarkSyncState {
  status: BenchmarkSyncStatus;
  startedAt: string | null;
  finishedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
}

export class OpenRouterBenchmarkSyncConfigurationError extends Error {}

export class OpenRouterBenchmarkSyncApplicationService {
  private readonly outputDir: string;
  private readonly datasetFilePath: string;
  private readonly openRouterApiKey?: string;
  private readonly runner: OpenRouterBenchmarkSyncRunner;
  private inFlight: Promise<void> | null = null;
  private state: OpenRouterBenchmarkSyncState = {
    status: "idle",
    startedAt: null,
    finishedAt: null,
    lastSuccessAt: null,
    lastError: null,
  };

  constructor(options: OpenRouterBenchmarkSyncApplicationServiceOptions) {
    this.outputDir = options.outputDir;
    this.datasetFilePath = options.datasetFilePath;
    this.openRouterApiKey = options.openRouterApiKey;
    this.runner = options.runner ?? runSyncInProcess;
  }

  getStatus(): BenchmarkSyncStatusResponse {
    return {
      ...this.state,
      isRunning: this.state.status === "running",
      datasetExists: existsSync(this.datasetFilePath),
      canTrigger: !this.inFlight,
      cooldownUntil: null,
    };
  }

  start(): TriggerBenchmarkSyncResponse {
    if (this.inFlight) {
      return { ...this.getStatus(), triggered: false };
    }

    const apiKey = this.openRouterApiKey?.trim();
    if (!apiKey) {
      const message = "OPENROUTER_API_KEY is not configured";
      this.state = {
        ...this.state,
        status: "failed",
        finishedAt: new Date().toISOString(),
        lastError: message,
      };
      throw new OpenRouterBenchmarkSyncConfigurationError(message);
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
  await fetchAndPersistOpenRouterBenchmarks({
    apiKey: options.apiKey,
    outputDir: options.outputDir,
  });
}

function normalizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message.length > MAX_ERROR_LENGTH
    ? `${message.slice(0, MAX_ERROR_LENGTH)}...`
    : message;
}

export function createOpenRouterBenchmarkSyncApplicationService(options: {
  storagePath: string;
  openRouterApiKey?: string;
  runner?: OpenRouterBenchmarkSyncRunner;
}): OpenRouterBenchmarkSyncApplicationService {
  const outputDir = path.join(options.storagePath, "benchmarks");
  return new OpenRouterBenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "openrouter-benchmarks.json"),
    openRouterApiKey: options.openRouterApiKey,
    runner: options.runner,
  });
}