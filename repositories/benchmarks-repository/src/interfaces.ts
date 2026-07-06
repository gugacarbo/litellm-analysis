import type { NormalizedModelBenchmark } from "@lite-llm/contracts/benchmarks";

export interface IBenchmarksRepository {
  upsert(models: NormalizedModelBenchmark[]): Promise<void>;
  getAll(): Promise<NormalizedModelBenchmark[]>;
  getByAaModelId(
    aaModelId: string,
    source?: "artificial-analysis" | "openrouter",
  ): Promise<NormalizedModelBenchmark | null>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
