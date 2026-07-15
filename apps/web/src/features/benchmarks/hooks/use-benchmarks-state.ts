import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getBenchmarkSyncStatus,
  getModelBenchmarks,
} from "@/shared/lib/api-client/benchmarks";
import {
  type BenchmarkSortDirection,
  type BenchmarkSortField,
  useBenchmarksPaginated,
} from "./use-benchmarks-paginated";

type PaginatedBase = Omit<
  ReturnType<typeof useBenchmarksPaginated>,
  "setSortField" | "setSortDirection"
>;

interface UseBenchmarksStateResult extends PaginatedBase {
  syncStatusLabel: string;
  syncCooldownLabel: string | null;
  syncLastError: string | null;
  isSyncRunning: boolean;
  canTriggerSync: boolean;
  triggerSync: () => void;
  configuredCount: number;
  configuredModelNames: string[];
  unmatchedConfiguredModels: string[];
  search: string;
  setSearch: (value: string) => void;
  provider: string;
  setProvider: (value: string) => void;
  showConfiguredOnly: boolean;
  setShowConfiguredOnly: (value: boolean) => void;
  minIntelligence: string;
  setMinIntelligence: (value: string) => void;
  maxBlendedPrice: string;
  setMaxBlendedPrice: (value: string) => void;
  sortField: BenchmarkSortField;
  setSortField: (value: BenchmarkSortField) => void;
  sortDirection: BenchmarkSortDirection;
  setSortDirection: (value: BenchmarkSortDirection) => void;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
}

export function useBenchmarksState(): UseBenchmarksStateResult {
  const paginated = useBenchmarksPaginated({
    queryKeyPrefix: ["benchmarks"],
    fetcher: async (params) => getModelBenchmarks(Object.fromEntries(params)),
    defaultSortField: "intelligence",
    defaultConfiguredOnly: true,
  });

  const syncStatusQuery = useQuery({
    queryKey: ["benchmarks", "sync-status"],
    queryFn: getBenchmarkSyncStatus,
    refetchInterval: (query) => (query.state.data?.isRunning ? 2_000 : false),
  });

  const syncStatus = syncStatusQuery.data;
  const isSyncRunning = Boolean(syncStatus?.isRunning);
  const canTriggerSync =
    Boolean(syncStatus?.canTrigger ?? true) && !isSyncRunning;

  const configuredCount = useMemo(
    () =>
      paginated.data?.models.filter((item) => item.isConfigured).length ?? 0,
    [paginated.data?.models],
  );

  return {
    ...paginated,
    configuredCount,
    configuredModelNames: paginated.data?.configuredModelNames ?? [],
    unmatchedConfiguredModels: paginated.data?.unmatchedConfiguredModels ?? [],
    syncStatusLabel: getSyncStatusLabel(syncStatus),
    syncCooldownLabel: getSyncCooldownLabel(syncStatus),
    syncLastError: syncStatus?.lastError ?? null,
    isSyncRunning,
    canTriggerSync,
    triggerSync: () => undefined,
    search: paginated.filters.search,
    setSearch: (value) => paginated.setFilter("search", value),
    provider: paginated.filters.provider,
    setProvider: (value) => {
      paginated.setFilter("provider", value);
      paginated.applyFilters();
    },
    showConfiguredOnly: paginated.filters.configuredOnly,
    setShowConfiguredOnly: (value) => {
      paginated.setFilter("configuredOnly", value);
      paginated.applyFilters();
    },
    minIntelligence: paginated.filters.minIntelligence,
    setMinIntelligence: (value) =>
      paginated.setFilter("minIntelligence", value),
    maxBlendedPrice: paginated.filters.maxPrice,
    setMaxBlendedPrice: (value) => paginated.setFilter("maxPrice", value),
    sortField: paginated.sortField,
    setSortField: paginated.setSortField,
    sortDirection: paginated.sortDirection,
    setSortDirection: paginated.setSortDirection,
    source: paginated.data?.source ?? "Artificial Analysis",
    sourceUrl: paginated.data?.sourceUrl ?? "https://artificialanalysis.ai",
    fetchedAt: paginated.data?.fetchedAt ?? "",
  };
}

function getSyncStatusLabel(
  status: Awaited<ReturnType<typeof getBenchmarkSyncStatus>> | undefined,
): string {
  if (!status) {
    return "Sync status unavailable";
  }
  if (status.isRunning) {
    return "Sync running";
  }
  if (status.status === "succeeded" && status.lastSuccessAt) {
    return `Last sync: ${new Date(status.lastSuccessAt).toLocaleString()}`;
  }
  if (status.status === "failed") {
    return "Last sync failed";
  }
  if (status.datasetExists) {
    return "Local benchmark snapshot ready";
  }
  return "No local benchmark snapshot";
}

function getSyncCooldownLabel(
  status: Awaited<ReturnType<typeof getBenchmarkSyncStatus>> | undefined,
): string | null {
  if (
    !status ||
    status.isRunning ||
    status.canTrigger ||
    !status.cooldownUntil
  ) {
    return null;
  }

  return `Next sync available at ${new Date(status.cooldownUntil).toLocaleString()}`;
}
