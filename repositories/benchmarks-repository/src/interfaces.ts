import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkCatalog,
  BenchmarkSnapshotMetadata,
  NormalizedModelBenchmark,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";

export type SnapshotItems =
  | ArtificialAnalysisBenchmarkItem[]
  | OpenRouterBenchmarkItem[];

export interface StoredBenchmarkSnapshot {
  metadata: BenchmarkSnapshotMetadata;
  items: SnapshotItems;
}

export interface IBenchmarksRepository {
  upsert(models: NormalizedModelBenchmark[]): Promise<void>;
  getAll(): Promise<NormalizedModelBenchmark[]>;
  getByAaModelId(
    aaModelId: string,
    source?: "artificial-analysis" | "openrouter",
  ): Promise<NormalizedModelBenchmark | null>;
  count(): Promise<number>;
  clear(): Promise<void>;
  replaceSnapshot(snapshot: StoredBenchmarkSnapshot): Promise<void>;
  getSnapshot(
    catalog: BenchmarkCatalog,
  ): Promise<StoredBenchmarkSnapshot | null>;
}
