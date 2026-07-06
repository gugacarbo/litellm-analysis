import type {
  BenchmarkSyncStatusResponse,
  ModelBenchmarkApiResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts";
import { fetchApi } from "./core";

export async function getOpenRouterBenchmarks(): Promise<ModelBenchmarkApiResponse> {
  return fetchApi("/benchmarks/openrouter/models");
}

export async function getOpenRouterBenchmarkSyncStatus(): Promise<BenchmarkSyncStatusResponse> {
  return fetchApi("/benchmarks/openrouter/sync-status");
}

export async function triggerOpenRouterBenchmarkSync(): Promise<TriggerBenchmarkSyncResponse> {
  return fetchApi("/benchmarks/openrouter/sync", {
    method: "POST",
  });
}
