export interface NormalizedModelBenchmark {
  id: string;
  name: string;
  slug: string | null;
  creatorId: string | null;
  creatorName: string;
  creatorSlug: string | null;
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

export interface ModelBenchmarkApiResponse {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  count: number;
  configuredModelNames: string[];
  models: ModelBenchmarkListItem[];
}
