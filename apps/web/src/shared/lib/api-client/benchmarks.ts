import type {
  BenchmarkSyncStatusResponse,
  ModelBenchmarkApiResponse,
  TriggerBenchmarkSyncResponse,
} from "@lite-llm/contracts";
import { fetchApi } from "./core";

export interface BenchmarksQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  provider?: string;
  min_intelligence?: number;
  max_price?: number;
  sort_field?: "name" | "provider" | "intelligence" | "price" | "speed" | "latency";
  sort_direction?: "asc" | "desc";
  configuredOnly?: boolean;
}

function buildBenchmarksQuery(params: BenchmarksQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.page_size !== undefined) searchParams.set("page_size", String(params.page_size));
  if (params.search !== undefined && params.search !== "") {
    searchParams.set("search", params.search);
  }
  if (params.provider !== undefined && params.provider !== "all") {
    searchParams.set("provider", params.provider);
  }
  if (params.min_intelligence !== undefined) {
    searchParams.set("min_intelligence", String(params.min_intelligence));
  }
  if (params.max_price !== undefined) {
    searchParams.set("max_price", String(params.max_price));
  }
  if (params.sort_field !== undefined) searchParams.set("sort_field", params.sort_field);
  if (params.sort_direction !== undefined) searchParams.set("sort_direction", params.sort_direction);
  if (params.configuredOnly !== undefined) {
    searchParams.set("configuredOnly", String(params.configuredOnly));
  }
  return searchParams.toString();
}

export async function getModelBenchmarks(
  params: BenchmarksQueryParams = {},
): Promise<ModelBenchmarkApiResponse> {
  const query = buildBenchmarksQuery(params);
  return fetchApi(`/benchmarks/models${query ? `?${query}` : ""}`);
}

export async function getBenchmarkSyncStatus(): Promise<BenchmarkSyncStatusResponse> {
  return fetchApi("/benchmarks/sync-status");
}

export async function triggerBenchmarkSync(): Promise<TriggerBenchmarkSyncResponse> {
  return fetchApi("/benchmarks/sync", {
    method: "POST",
  });
}
