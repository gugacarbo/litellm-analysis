import type {
  BenchmarkSyncStatusResponse,
  ModelBenchmarkApiResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts";
import { fetchApi } from "./core";

export async function getModelBenchmarks(): Promise<ModelBenchmarkApiResponse> {
  return fetchApi("/benchmarks/models");
}

export async function getBenchmarkSyncStatus(): Promise<BenchmarkSyncStatusResponse> {
  return fetchApi("/benchmarks/sync-status");
}

export async function triggerBenchmarkSync(): Promise<TriggerBenchmarkSyncResponse> {
  return fetchApi("/benchmarks/sync", {
    method: "POST",
  });
}
