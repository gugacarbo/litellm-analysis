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

type OpenRouterBenchmarkSyncApiKeyResolver = () => Promise<string | null>;

export interface OpenRouterBenchmarkSyncApplicationServiceOptions {
  outputDir: string;
  datasetFilePath: string;
  resolveApiKey: OpenRouterBenchmarkSyncApiKeyResolver;
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
  private readonly resolveApiKey: OpenRouterBenchmarkSyncApiKeyResolver;
  private readonly runner: OpenRouterBenchmarkSyncRunner;
  private inFlight: Promise<void> | null = null;
  private isResolvingApiKey = false;
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
    this.resolveApiKey = options.resolveApiKey;
    this.runner = options.runner ?? runSyncInProcess;
  }

  getStatus(): BenchmarkSyncStatusResponse {
    return {
      ...this.state,
      isRunning: this.state.status === "running",
      datasetExists: existsSync(this.datasetFilePath),
      canTrigger: !this.inFlight && !this.isResolvingApiKey,
      cooldownUntil: null,
    };
  }

  async start(): Promise<TriggerBenchmarkSyncResponse> {
    if (this.inFlight || this.isResolvingApiKey) {
      return { ...this.getStatus(), triggered: false };
    }

    this.isResolvingApiKey = true;
    const startedAt = new Date().toISOString();
    this.state = {
      status: "running",
      startedAt,
      finishedAt: null,
      lastSuccessAt: this.state.lastSuccessAt,
      lastError: null,
    };

    try {
      const apiKey = await this.resolveApiKey();
      if (!apiKey?.trim()) {
        throw new Error("Application secret is unavailable");
      }

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
            lastError: normalizeError(error, apiKey),
          };
        })
        .finally(() => {
          this.inFlight = null;
        });

      return { ...this.getStatus(), triggered: true };
    } catch {
      const message = "OPENROUTER_API_KEY is not configured";
      this.state = {
        ...this.state,
        status: "failed",
        finishedAt: new Date().toISOString(),
        lastError: message,
      };
      throw new OpenRouterBenchmarkSyncConfigurationError(message);
    } finally {
      this.isResolvingApiKey = false;
    }
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

function normalizeError(error: unknown, apiKey: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const redacted = message.split(apiKey).join("[REDACTED]");

  return redacted.length > MAX_ERROR_LENGTH
    ? `${redacted.slice(0, MAX_ERROR_LENGTH)}...`
    : redacted;
}

export function createOpenRouterBenchmarkSyncApplicationService(options: {
  storagePath: string;
  resolveApiKey: OpenRouterBenchmarkSyncApiKeyResolver;
  runner?: OpenRouterBenchmarkSyncRunner;
}): OpenRouterBenchmarkSyncApplicationService {
  const outputDir = path.join(options.storagePath, "benchmarks");
  return new OpenRouterBenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "openrouter-benchmarks.json"),
    resolveApiKey: options.resolveApiKey,
    runner: options.runner,
  });
}
