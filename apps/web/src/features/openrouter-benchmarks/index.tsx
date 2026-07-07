import { useState } from "react";
import { RefreshCw } from "lucide-react";
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
import { LogsPaginationControls } from "@/features/logs/components/logs-pagination-controls";
import type { PaginationMetadata } from "@lite-llm/contracts/analytics";
import {
  formatBenchmarkPrice,
  formatFetchedAt,
  formatLatencySeconds,
  formatNullableNumber,
  formatSpeed,
} from "@/features/benchmarks/utils/benchmark-utils";
import { useOpenRouterBenchmarksState } from "./hooks/use-openrouter-benchmarks-state";

export function OpenRouterBenchmarksPage() {
  const page = useOpenRouterBenchmarksState();
  const {
    rows,
    isLoading,
    error,
    isDatasetMissing,
    syncStatusLabel,
    syncCooldownLabel,
    syncLastError,
    isSyncRunning,
    canTriggerSync,
    triggerSync,
    source,
    sourceUrl,
    fetchedAt,
    search,
    provider,
    minIntelligence,
    maxBlendedPrice,
    sortField,
    sortDirection,
    setSearch,
    setProvider,
    setMinIntelligence,
    setMaxBlendedPrice,
    setSortField,
    setSortDirection,
    pagination,
    page: currentPage,
    pageSize,
    goToPage,
    changePageSize,
  } = page;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleModel = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
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
                {syncStatusLabel}
              </Badge>
              {syncLastError && !isSyncRunning ? (
                <span className="max-w-xl truncate text-xs text-destructive">
                  {syncLastError}
                </span>
              ) : null}
              {syncCooldownLabel ? (
                <span className="text-xs text-muted-foreground">
                  {syncCooldownLabel}
                </span>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={triggerSync}
            disabled={!canTriggerSync}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={isSyncRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            {isSyncRunning ? "Syncing" : canTriggerSync ? "Sync" : "Locked"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
                  {page.providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Min intelligence</p>
              <Input
                value={minIntelligence}
                onChange={(event) => setMinIntelligence(event.target.value)}
                inputMode="decimal"
                placeholder="ex: 50"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Max blended price ($/M)
              </p>
              <Input
                value={maxBlendedPrice}
                onChange={(event) => setMaxBlendedPrice(event.target.value)}
                inputMode="decimal"
                placeholder="ex: 10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by</span>
              <Select
                value={sortField}
                onValueChange={(value) =>
                  setSortField(
                    value as
                      | "name"
                      | "provider"
                      | "intelligence"
                      | "price"
                      | "speed"
                      | "latency",
                  )
                }
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
                onValueChange={(value) =>
                  setSortDirection(value as "asc" | "desc")
                }
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
                onClick={triggerSync}
                disabled={isSyncRunning}
              >
                <RefreshCw
                  className={
                    isSyncRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"
                  }
                />
                {isSyncRunning ? "Syncing" : "Sync now"}
              </Button>
            </div>
          ) : error ? (
            <div className="py-4 text-sm text-red-500">{error}</div>
          ) : isLoading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No models match the filters"
              description="Try broadening the filter values."
            />
          ) : (
            <>
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
                  {rows.map((row) => (
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
                          variant={
                            selectedIds.includes(row.id)
                              ? "secondary"
                              : "outline"
                          }
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
              <LogsPaginationControls
                page={currentPage}
                pageSize={pageSize}
                pagination={pagination as PaginationMetadata}
                onPageChange={goToPage}
                onPageSizeChange={(value) => changePageSize(Number(value))}
              />
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Data from{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {source}
        </a>
        . Last update: {formatFetchedAt(fetchedAt)}.
      </p>
    </div>
  );
}
