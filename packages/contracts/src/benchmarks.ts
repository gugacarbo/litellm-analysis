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

export interface OpenRouterModelData {
  id: string;
  name: string;
  context_length: number | null;
  max_output_tokens: number | null;
  capabilities: {
    supports_vision: boolean;
    supports_tools: boolean;
  } | null;
  pricing: {
    prompt: string;
    completion: string;
  } | null;
  family: string | null;
  description: string | null;
}

export interface BenchmarkComparisonField {
  key: string;
  label: string;
  currentValue: string | number | boolean | null;
  aa: {
    value: string | number | boolean | null;
    source: string;
    sourceLabel: string;
  } | null;
  openrouter: {
    value: string | number | boolean | null;
    source: string;
    sourceLabel: string;
  } | null;
}

export interface BenchmarkComparisonResponse {
  modelName: string;
  matchedAaModel: string | null;
  matchedOpenRouterModel: string | null;
  fields: BenchmarkComparisonField[];
}

/** A persisted catalog is intentionally separate from the legacy normalized rows. */
export type BenchmarkCatalog = "artificial-analysis" | "openrouter";
export type OpenRouterBenchmarkSubsource =
  | "artificial-analysis"
  | "design-arena";

export interface BenchmarkAttribution {
  label: string;
  url: string;
  citation: string | null;
}

export interface BenchmarkSnapshotMetadata {
  catalog: BenchmarkCatalog;
  fetchedAt: string;
  count: number;
  attribution: BenchmarkAttribution;
}

export interface ArtificialAnalysisBenchmarkItem
  extends NormalizedModelBenchmark {
  source: "artificial-analysis";
}

/**
 * Keeps OpenRouter's source-native information rather than coercing Design
 * Arena ELO/win rate into Artificial Analysis' intelligence index.
 */
export interface OpenRouterBenchmarkItem {
  id: string;
  subsource: OpenRouterBenchmarkSubsource;
  modelPermaslug: string | null;
  name: string;
  provider: string | null;
  arena: string | null;
  category: string | null;
  elo: number | null;
  winRate: number | null;
  averageTimeSeconds: number | null;
  intelligenceIndex: number | null;
  priceInput1mTokens: number | null;
  priceOutput1mTokens: number | null;
  attribution: BenchmarkAttribution;
  native: Record<string, BenchmarkNativeValue>;
}

export type BenchmarkNativeValue =
  | null
  | boolean
  | number
  | string
  | BenchmarkNativeValue[]
  | { [key: string]: BenchmarkNativeValue };

export interface BenchmarkPage<T> {
  metadata: BenchmarkSnapshotMetadata;
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}
