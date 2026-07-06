import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getOpenRouterBenchmarks,
  getOpenRouterBenchmarkSyncStatus,
  triggerOpenRouterBenchmarkSync,
} from "@/shared/lib/api-client/openrouter-benchmarks";
import { ApiError } from "@/shared/lib/api-client/core";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Input } from "@/shared/components/ui/input";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { BenchmarkSortDirection, BenchmarkSortField } from "@/features/benchmarks/types/benchmark-types";
import {
  formatBenchmarkPrice,
  formatFetchedAt,
  formatLatencySeconds,
  formatNullableNumber,
  formatSpeed,
} from "@/features/benchmarks/utils/benchmark-utils";
import {
  matchesBenchmarkModelSearch,
  sortBenchmarkModelsBySearch,
} from "@/features/benchmarks/utils/model-search";

function sortRows(
  rows: ModelBenchmarkListItem[],
  sortField: BenchmarkSortField,
  sortDirection: BenchmarkSortDirection,
): ModelBenchmarkListItem[] {
  const dir = sortDirection === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (sortField) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "provider":
        return dir * a.creatorName.localeCompare(b.creatorName);
      case "intelligence":
        return dir * ((a.intelligenceIndex ?? -1) - (b.intelligenceIndex ?? -1));
      case "price":
        return dir * ((a.priceBlended1mTokens ?? Infinity) - (b.priceBlended1mTokens ?? Infinity));
      case "speed":
        return dir * ((a.medianOutputTokensPerSecond ?? -1) - (b.medianOutputTokensPerSecond ?? -1));
      default:
        return dir * ((a.medianTimeToFirstTokenSeconds ?? Infinity) - (b.medianTimeToFirstTokenSeconds ?? Infinity));
    }
  });
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
  if (!status || status.isRunning || status.canTrigger || !status.cooldownUntil) return null;
  return `Next sync available at ${new Date(status.cooldownUntil).toLocaleString()}`;
}

export function OpenRouterBenchmarksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [sortField, setSortField] = useState<BenchmarkSortField>("intelligence");
  const [sortDirection, setSortDirection] = useState<BenchmarkSortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const benchmarksQuery = useQuery({
    queryKey: ["openrouter-benchmarks", "models"],
    queryFn: getOpenRouterBenchmarks,
    refetchInterval: 10 * 60_000,
    retry: (failureCount, error) =>
      error instanceof ApiError && error.code === "OPENROUTER_BENCHMARK_DATASET_MISSING"
        ? false
        : failureCount < 3,
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
      await queryClient.invalidateQueries({ queryKey: ["openrouter-benchmarks", "sync-status"] });
      if (result.triggered) toast.success("OpenRouter sync started");
      else if (result.isRunning) toast.success("OpenRouter sync is already running");
      else if (!result.canTrigger)
        toast.info(getSyncCooldownLabel(syncStatusQuery.data) ?? "Sync will be available soon");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to start sync");
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
      queryClient.invalidateQueries({ queryKey: ["openrouter-benchmarks", "models"] });
    } else if (status.status === "failed") {
      toast.error(status.lastError ?? "OpenRouter sync failed");
    }
  }, [queryClient, syncStatusQuery.data]);

  const rows = benchmarksQuery.data?.models ?? [];
  const benchmarkError = benchmarksQuery.error instanceof Error ? benchmarksQuery.error : null;
  const isDatasetMissing =
    benchmarkError instanceof ApiError && benchmarkError.code === "OPENROUTER_BENCHMARK_DATASET_MISSING";
  const syncStatus = syncStatusQuery.data;
  const isSyncRunning = Boolean(syncStatus?.isRunning || syncMutation.isPending);
  const canTriggerSync = Boolean(syncStatus?.canTrigger ?? true) && !isSyncRunning;

  const providers = useMemo(() => {
    const unique = new Set<string>();
    for (const row of rows) unique.add(row.creatorName);
    return Array.from(unique).sort();
  }, [rows]);

  const searchValue = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const base = provider === "all" ? rows : rows.filter((r) => r.creatorName === provider);
    const matched = searchValue
      ? base.filter((r) => matchesBenchmarkModelSearch(searchValue, r))
      : base;
    const sorted = sortRows(matched, sortField, sortDirection);
    return searchValue ? sortBenchmarkModelsBySearch(searchValue, sorted) : sorted;
  }, [rows, provider, searchValue, sortField, sortDirection]);

  const toggleModel = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <PageLayout
      title="OpenRouter Benchmarks"
      subtitle="Aggregated benchmark data from OpenRouter (Artificial Analysis + Design Arena)"
      icon={Globe}
      showFilters={false}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Data Source
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isSyncRunning ? "secondary" : "outline"}>
                  {getSyncStatusLabel(syncStatus)}
                </Badge>
                {syncStatus?.lastError && !isSyncRunning ? (
                  <span className="max-w-xl truncate text-xs text-destructive">
                    {syncStatus.lastError}
                  </span>
                ) : null}
                {getSyncCooldownLabel(syncStatus) ? (
                  <span className="text-xs text-muted-foreground">
                    {getSyncCooldownLabel(syncStatus)}
                  </span>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!canTriggerSync) {
                  toast.info(getSyncCooldownLabel(syncStatus) ?? "Sync will be available soon");
                  return;
                }
                syncMutation.mutate();
              }}
              disabled={!canTriggerSync}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={isSyncRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {isSyncRunning ? "Syncing" : canTriggerSync ? "Sync" : "Locked"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Search model</p>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="gpt-4.1, claude..."
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Provider</p>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sort by</span>
                <Select
                  value={sortField}
                  onValueChange={(value) => setSortField(value as BenchmarkSortField)}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intelligence">Intelligence</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="speed">Speed</SelectItem>
                    <SelectItem value="latency">Latency</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="name">Model name</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortDirection}
                  onValueChange={(value) => setSortDirection(value as "asc" | "desc")}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-2">
            {isDatasetMissing ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <EmptyState
                  title="No OpenRouter benchmark data yet"
                  description="Start a sync to fetch the latest dataset."
                  className="py-0"
                />
                <Button
                  type="button"
                  onClick={() => syncMutation.mutate()}
                  disabled={isSyncRunning}
                >
                  <RefreshCw className={isSyncRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  {isSyncRunning ? "Syncing" : "Sync now"}
                </Button>
              </div>
            ) : benchmarkError ? (
              <div className="py-4 text-sm text-red-500">{benchmarkError.message}</div>
            ) : benchmarksQuery.isPending && !benchmarksQuery.data ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No models match the filters"
                description="Try broadening the filter values."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Intelligence</TableHead>
                    <TableHead className="text-right">Coding</TableHead>
                    <TableHead className="text-right">Math</TableHead>
                    <TableHead className="text-right">Price (3:1)</TableHead>
                    <TableHead className="text-right">Speed</TableHead>
                    <TableHead className="text-right">TTFT</TableHead>
                    <TableHead className="text-right">Compare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.name}</span>
                          {row.isConfigured && (
                            <Badge variant="success">Configured</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row.slug ?? "no-slug"}
                        </p>
                      </TableCell>
                      <TableCell>{row.creatorName}</TableCell>
                      <TableCell className="text-right">
                        {formatNullableNumber(row.intelligenceIndex)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNullableNumber(row.codingIndex)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNullableNumber(row.mathIndex)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBenchmarkPrice(row.priceBlended1mTokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatSpeed(row.medianOutputTokensPerSecond)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatLatencySeconds(row.medianTimeToFirstTokenSeconds)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={selectedIds.includes(row.id) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => toggleModel(row.id)}
                        >
                          {selectedIds.includes(row.id) ? "Added" : "Compare"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Data from{" "}
          <a
            href={benchmarksQuery.data?.sourceUrl ?? "https://openrouter.ai/"}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {benchmarksQuery.data?.source ?? "OpenRouter"}
          </a>
          . Last update: {formatFetchedAt(benchmarksQuery.data?.fetchedAt ?? "")}.
        </p>
      </div>
    </PageLayout>
  );
}
