import { existsSync } from "node:fs";
import path from "node:path";
import type {
  BenchmarkSyncStatus,
  BenchmarkSyncStatusResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts/benchmarks";
import { fetchAndPersistBenchmarks } from "./benchmark-fetcher";

const MAX_ERROR_LENGTH = 1_000;
const SYNC_COOLDOWN_MS = 60 * 60_000;

type BenchmarkSyncRunner = (options: {
  apiKey: string;
  outputDir: string;
}) => Promise<void>;

type BenchmarkSyncApiKeyResolver = () => Promise<string | null>;

export interface BenchmarkSyncApplicationServiceOptions {
  outputDir: string;
  datasetFilePath: string;
  resolveApiKey: BenchmarkSyncApiKeyResolver;
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
  private readonly resolveApiKey: BenchmarkSyncApiKeyResolver;
  private readonly runner: BenchmarkSyncRunner;
  private inFlight: Promise<void> | null = null;
  private isResolvingApiKey = false;
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
    this.resolveApiKey = options.resolveApiKey;
    this.runner = options.runner ?? runSyncInProcess;
  }

  getStatus(): BenchmarkSyncStatusResponse {
    const cooldownUntil = getCooldownUntil(this.state.lastSuccessAt);
    const canTrigger =
      !this.isResolvingApiKey &&
      this.state.status !== "running" &&
      (!cooldownUntil || Date.parse(cooldownUntil) <= Date.now());

    return {
      ...this.state,
      isRunning: this.state.status === "running",
      canTrigger,
      datasetExists: existsSync(this.datasetFilePath),
      cooldownUntil,
    };
  }

  async start(): Promise<TriggerBenchmarkSyncResponse> {
    const currentStatus = this.getStatus();

    if (this.inFlight || this.isResolvingApiKey || !currentStatus.canTrigger) {
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
      const message = "ARTIFICIAL_ANALYSIS_API_KEY is not configured";
      this.state = {
        ...this.state,
        status: "failed",
        finishedAt: new Date().toISOString(),
        lastError: message,
      };
      throw new BenchmarkSyncConfigurationError(message);
    } finally {
      this.isResolvingApiKey = false;
    }
  }
}

function getCooldownUntil(lastSuccessAt: string | null): string | null {
  if (!lastSuccessAt) {
    return null;
  }

  const lastSuccessMs = Date.parse(lastSuccessAt);
  if (Number.isNaN(lastSuccessMs)) {
    return null;
  }

  return new Date(lastSuccessMs + SYNC_COOLDOWN_MS).toISOString();
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

function normalizeError(error: unknown, apiKey: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const redacted = message.split(apiKey).join("[REDACTED]");

  return redacted.length > MAX_ERROR_LENGTH
    ? `${redacted.slice(0, MAX_ERROR_LENGTH)}...`
    : redacted;
}

export function createBenchmarkSyncApplicationService(options: {
  storagePath: string;
  resolveApiKey: BenchmarkSyncApiKeyResolver;
  runner?: BenchmarkSyncRunner;
}): BenchmarkSyncApplicationService {
  const outputDir = path.join(options.storagePath, "benchmarks");
  return new BenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
    resolveApiKey: options.resolveApiKey,
    runner: options.runner,
  });
}
