import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  BenchmarkSortDirection,
  BenchmarkSortField,
} from "../types/benchmark-types";
import {
  type BenchmarkFilters,
  type BenchmarkPagination,
  type UseBenchmarkListState,
  useBenchmarkServerFilters,
} from "./use-benchmark-server-filters";
import {
  getBenchmarkSyncStatus,
  getModelBenchmarks,
  triggerBenchmarkSync,
} from "@/shared/lib/api-client/benchmarks";
import { ApiError } from "@/shared/lib/api-client/core";

interface UseBenchmarksStateResult extends UseBenchmarkListState {
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
  showConfiguredOnly: boolean,
  minIntelligence: string,
  maxBlendedPrice: string,
  sortField: BenchmarkSortField,
  sortDirection: BenchmarkSortDirection,
): BenchmarkFilters {
  return {
    search: search.trim() || undefined,
    provider: provider === "all" ? undefined : provider,
    configuredOnly: showConfiguredOnly || undefined,
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

export function useBenchmarksState(): UseBenchmarksStateResult {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [showConfiguredOnly, setShowConfiguredOnly] = useState(true);
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
        showConfiguredOnly,
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
      showConfiguredOnly,
      sortDirection,
      sortField,
    ],
  );

  const serverState = useBenchmarkServerFilters({
    queryKey: ["benchmarks", "models"],
    fetchFn: getModelBenchmarks,
    filters,
  });

  const syncStatusQuery = useQuery({
    queryKey: ["benchmarks", "sync-status"],
    queryFn: getBenchmarkSyncStatus,
    refetchInterval: (query) => (query.state.data?.isRunning ? 2_000 : false),
  });

  const previousSyncRunningRef = useRef(false);
  const syncMutation = useMutation({
    mutationFn: triggerBenchmarkSync,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["benchmarks", "sync-status"],
      });
      if (result.triggered) {
        toast.success("Benchmark sync started");
      } else if (result.isRunning) {
        toast.success("Benchmark sync is already running");
      } else if (!result.canTrigger) {
        toast.info(
          getSyncCooldownLabel(result) ??
            "Benchmark sync will be available soon",
        );
      }
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
      toast.success("Benchmark sync completed");
      void serverState.refetch();
    } else if (status.status === "failed") {
      toast.error(status.lastError ?? "Benchmark sync failed");
    }
  }, [serverState, syncStatusQuery.data]);

  const syncStatus = syncStatusQuery.data;
  const isSyncRunning = Boolean(
    syncStatus?.isRunning || syncMutation.isPending,
  );
  const canTriggerSync =
    Boolean(syncStatus?.canTrigger ?? true) && !isSyncRunning;
  const rows = serverState.rows;

  const configuredCount = useMemo(
    () => serverState.data?.models.filter((item) => item.isConfigured).length ?? 0,
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
          getSyncCooldownLabel(syncStatus) ??
            "Benchmark sync will be available soon",
        );
        return;
      }

      syncMutation.mutate();
    },
    search,
    setSearch,
    provider,
    setProvider,
    showConfiguredOnly,
    setShowConfiguredOnly,
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
  if (!status || status.isRunning || status.canTrigger || !status.cooldownUntil) {
    return null;
  }

  return `Next sync available at ${new Date(status.cooldownUntil).toLocaleString()}`;
}
