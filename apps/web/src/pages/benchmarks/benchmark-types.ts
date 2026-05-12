import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";

export type BenchmarkSortField =
  | "name"
  | "provider"
  | "intelligence"
  | "price"
  | "speed"
  | "latency";

export type BenchmarkSortDirection = "asc" | "desc";

export interface BenchmarksFilterState {
  search: string;
  provider: string;
  showConfiguredOnly: boolean;
  minIntelligence: string;
  maxBlendedPrice: string;
  sortField: BenchmarkSortField;
  sortDirection: BenchmarkSortDirection;
}

export interface BenchmarksDerivedState {
  providers: string[];
  rows: ModelBenchmarkListItem[];
  configuredCount: number;
}
