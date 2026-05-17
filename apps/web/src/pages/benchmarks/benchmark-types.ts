import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";

export type BenchmarkSortField =
  | "name"
  | "provider"
  | "intelligence"
  | "price"
  | "speed"
  | "latency";

export type BenchmarkSortDirection = "asc" | "desc";

export interface BenchmarksDerivedState {
  providers: string[];
  rows: ModelBenchmarkListItem[];
  configuredCount: number;
}

export type UseCase =
  | "intelligence"
  | "coding"
  | "agentic"
  | "fastAndCheap"
  | "balanced";

export type PercentileMap = Map<
  | "intelligenceIndex"
  | "codingIndex"
  | "mathIndex"
  | "agenticIndex"
  | "medianOutputTokensPerSecond"
  | "medianTimeToFirstTokenSeconds"
  | "priceBlended1mTokens",
  number
>;

export interface UseCaseScores {
  intelligence: number;
  coding: number;
  agentic: number;
  fastAndCheap: number;
  balanced: number;
}

export interface AgenticScore {
  tau2: number | null;
  ifbench: number | null;
  lcr: number | null;
  terminalbenchHard: number | null;
  agenticIndex: number | null;
  coverage: number;
}

export interface ValueScore {
  intelligencePerDollar: number | null;
  speedPerDollar: number | null;
  agenticPerDollar: number | null;
}

export interface ComparisonCardData {
  model: ModelBenchmarkListItem;
  agentic: AgenticScore;
  value: ValueScore;
  compositeScore: number;
  percentiles: PercentileMap;
  useCaseScores: UseCaseScores;
  rank: {
    intelligence: number;
    coding: number;
    math: number;
    agentic: number;
    speed: number;
    price: number;
    value: number;
  };
  coverageCount: number;
  totalBenchmarks: number;
}
