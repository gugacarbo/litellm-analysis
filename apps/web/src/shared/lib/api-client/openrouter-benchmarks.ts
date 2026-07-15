import type {
  BenchmarkSyncStatusResponse,
  ModelBenchmarkApiResponse,
} from "@lite-llm/contracts";
import { fetchApi } from "./core";

export interface BenchmarkListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  provider?: string;
  minIntelligence?: number;
  maxPrice?: number;
  sortField?:
    | "name"
    | "provider"
    | "intelligence"
    | "price"
    | "speed"
    | "latency";
  sortDirection?: "asc" | "desc";
}

function toQueryString(params: BenchmarkListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.pageSize !== undefined)
    searchParams.set("page_size", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.provider) searchParams.set("provider", params.provider);
  if (params.minIntelligence !== undefined)
    searchParams.set("min_intelligence", String(params.minIntelligence));
  if (params.maxPrice !== undefined)
    searchParams.set("max_price", String(params.maxPrice));
  if (params.sortField) searchParams.set("sort_field", params.sortField);
  if (params.sortDirection)
    searchParams.set("sort_direction", params.sortDirection);
  return searchParams.toString();
}

export async function getOpenRouterBenchmarks(
  params: BenchmarkListParams = {},
): Promise<ModelBenchmarkApiResponse> {
  const query = toQueryString(params);
  return fetchApi(`/benchmarks/openrouter/models${query ? `?${query}` : ""}`);
}

export async function getOpenRouterBenchmarkSyncStatus(): Promise<BenchmarkSyncStatusResponse> {
  return fetchApi("/benchmarks/openrouter/sync-status");
}
