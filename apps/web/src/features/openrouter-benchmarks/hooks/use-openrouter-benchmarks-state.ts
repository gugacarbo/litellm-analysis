import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  BenchmarkSortDirection,
  BenchmarkSortField,
} from "@/features/benchmarks/types/benchmark-types";
import {
  type BenchmarkFilters,
  type UseBenchmarkListState,
  useBenchmarkServerFilters,
} from "@/features/benchmarks/hooks/use-benchmark-server-filters";
import {
  getOpenRouterBenchmarks,
  getOpenRouterBenchmarkSyncStatus,
  triggerOpenRouterBenchmarkSync,
} from "@/shared/lib/api-client/openrouter-benchmarks";

interface UseOpenRouterBenchmarksStateResult extends UseBenchmarkListState {
  syncStatusLabel: string;
  syncCooldownLabel: string | null;
  syncLastError: string | null;
  isSyncRunning: boolean;
  canTriggerSync: boolean;
  triggerSync: () => void;
  configuredCount: number;
  configuredModelNames: string[];
  unmatchedConfiguredModels: string[];
}

function buildServerFilters(
  search: string,
  provider: string,
  minIntelligence: string,
  maxBlendedPrice: string,
  sortField: BenchmarkSortField,
  sortDirection: BenchmarkSortDirection,
): BenchmarkFilters {
  return {
    search: search.trim() || undefined,
    provider: provider === "all" ? undefined : provider,
    minIntelligence:
      minIntelligence === ""
        ? undefined
        : Number.parseFloat(minIntelligence) || undefined,
    maxPrice:
      maxBlendedPrice === ""
        ? undefined
        : Number.parseFloat(maxBlendedPrice) || undefined,
    sortField,
    sortDirection,
  };
}

function getSyncStatusLabel(
  status: Awaited<ReturnType<typeof getOpenRouterBenchmarkSyncStatus>> | undefined,
): string {
  if (!status) return "Sync status unavailable";
  if (status.isRunning) return "Sync running";
  if (status.status === "succeeded" && status.lastSuccessAt)
    return `Last sync: ${new Date(status.lastSuccessAt).toLocaleString()}`;
  if (status.status === "failed") return "Last sync failed";
  if (status.datasetExists) return "Local benchmark snapshot ready";
  return "No local benchmark snapshot";
}

function getSyncCooldownLabel(
  status: Awaited<ReturnType<typeof getOpenRouterBenchmarkSyncStatus>> | undefined,
): string | null {
  if (!status || status.isRunning || status.canTrigger || !status.cooldownUntil)
    return null;
  return `Next sync available at ${new Date(status.cooldownUntil).toLocaleString()}`;
}

export function useOpenRouterBenchmarksState(): UseOpenRouterBenchmarksStateResult {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [minIntelligence, setMinIntelligence] = useState("");
  const [maxBlendedPrice, setMaxBlendedPrice] = useState("");
  const [sortField, setSortField] =
    useState<BenchmarkSortField>("intelligence");
  const [sortDirection, setSortDirection] =
    useState<BenchmarkSortDirection>("desc");

  const filters = useMemo(
    () =>
      buildServerFilters(
        search,
        provider,
        minIntelligence,
        maxBlendedPrice,
        sortField,
        sortDirection,
      ),
    [
      maxBlendedPrice,
      minIntelligence,
      provider,
      search,
      sortDirection,
      sortField,
    ],
  );

  const serverState = useBenchmarkServerFilters({
    queryKey: ["openrouter-benchmarks", "models"],
    fetchFn: getOpenRouterBenchmarks,
    filters,
    datasetMissingCode: "OPENROUTER_BENCHMARK_DATASET_MISSING",
  });

  const syncStatusQuery = useQuery({
    queryKey: ["openrouter-benchmarks", "sync-status"],
    queryFn: getOpenRouterBenchmarkSyncStatus,
    refetchInterval: (query) => (query.state.data?.isRunning ? 2_000 : false),
  });

  const previousSyncRunningRef = useRef(false);
  const syncMutation = useMutation({
    mutationFn: triggerOpenRouterBenchmarkSync,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["openrouter-benchmarks", "sync-status"],
      });
      if (result.triggered) toast.success("OpenRouter sync started");
      else if (result.isRunning)
        toast.success("OpenRouter sync is already running");
      else if (!result.canTrigger)
        toast.info(
          getSyncCooldownLabel(syncStatusQuery.data) ??
            "Sync will be available soon",
        );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to start sync",
      );
    },
  });

  useEffect(() => {
    const status = syncStatusQuery.data;
    if (!status) return;
    const wasRunning = previousSyncRunningRef.current;
    previousSyncRunningRef.current = status.isRunning;
    if (!wasRunning || status.isRunning) return;
    if (status.status === "succeeded") {
      toast.success("OpenRouter sync completed");
      void serverState.refetch();
    } else if (status.status === "failed") {
      toast.error(status.lastError ?? "OpenRouter sync failed");
    }
  }, [serverState, syncStatusQuery.data]);

  const syncStatus = syncStatusQuery.data;
  const isSyncRunning = Boolean(
    syncStatus?.isRunning || syncMutation.isPending,
  );
  const canTriggerSync =
    Boolean(syncStatus?.canTrigger ?? true) && !isSyncRunning;

  const configuredCount = useMemo(
    () =>
      serverState.data?.models.filter((item) => item.isConfigured).length ?? 0,
    [serverState.data?.models],
  );

  return {
    ...serverState,
    configuredCount,
    configuredModelNames: serverState.data?.configuredModelNames ?? [],
    unmatchedConfiguredModels:
      serverState.data?.unmatchedConfiguredModels ?? [],
    syncStatusLabel: getSyncStatusLabel(syncStatus),
    syncCooldownLabel: getSyncCooldownLabel(syncStatus),
    syncLastError: syncStatus?.lastError ?? null,
    isSyncRunning,
    canTriggerSync,
    triggerSync: () => {
      if (!canTriggerSync) {
        toast.info(
          getSyncCooldownLabel(syncStatus) ?? "Sync will be available soon",
        );
        return;
      }
      syncMutation.mutate();
    },
    search,
    setSearch,
    provider,
    setProvider,
    minIntelligence,
    setMinIntelligence,
    maxBlendedPrice,
    setMaxBlendedPrice,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
  };
}
