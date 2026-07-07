export interface NormalizedModelBenchmark {
  id: string;
  name: string;
  slug: string | null;
  creatorId: string | null;
  creatorName: string;
  creatorSlug: string | null;
  source: "artificial-analysis" | "openrouter";
  intelligenceIndex: number | null;
  codingIndex: number | null;
  mathIndex: number | null;
  mmluPro: number | null;
  gpqa: number | null;
  hle: number | null;
  livecodebench: number | null;
  scicode: number | null;
  math500: number | null;
  aime: number | null;
  aime25: number | null;
  tau2: number | null;
  ifbench: number | null;
  lcr: number | null;
  terminalbenchHard: number | null;
  priceInput1mTokens: number | null;
  priceOutput1mTokens: number | null;
  priceBlended1mTokens: number | null;
  medianOutputTokensPerSecond: number | null;
  medianTimeToFirstTokenSeconds: number | null;
  medianTimeToFirstAnswerTokenSeconds: number | null;
}

export interface StoredModelBenchmarkDataset {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  count: number;
  models: NormalizedModelBenchmark[];
}

export interface ModelBenchmarkListItem extends NormalizedModelBenchmark {
  isConfigured: boolean;
  matchedConfiguredModel: string | null;
}

import type { PaginationMetadata } from "./analytics";

export interface ModelBenchmarkApiResponse {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  count: number;
  configuredModelNames: string[];
  unmatchedConfiguredModels: string[];
  models: ModelBenchmarkListItem[];
  pagination: PaginationMetadata;
}

export type BenchmarkSyncStatus = "idle" | "running" | "succeeded" | "failed";

export interface BenchmarkSyncStatusResponse {
  status: BenchmarkSyncStatus;
  isRunning: boolean;
  canTrigger: boolean;
  datasetExists: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  lastSuccessAt: string | null;
  cooldownUntil: string | null;
  lastError: string | null;
}

export interface TriggerBenchmarkSyncResponse
  extends BenchmarkSyncStatusResponse {
  triggered: boolean;
}
