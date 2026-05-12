import type { ModelBenchmarkApiResponse } from "@lite-llm/api-contracts";
import { fetchApi } from "./core";

export async function getModelBenchmarks(): Promise<ModelBenchmarkApiResponse> {
  return fetchApi("/benchmarks/models");
}
