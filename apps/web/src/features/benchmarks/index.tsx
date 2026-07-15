import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { Filter } from "lucide-react";
import { LogsPaginationControls } from "@/features/logs/components/logs-pagination-controls";
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
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { ComparisonDeck } from "./components/comparison-deck";
import { UseCaseFilter } from "./components/use-case-filter";
import { useBenchmarksPage } from "./hooks/use-benchmarks-page";
import {
  formatBenchmarkPrice,
  formatFetchedAt,
  formatLatencySeconds,
  formatNullableNumber,
  formatSpeed,
} from "./utils/benchmark-utils";

export function BenchmarksPage() {
  const page = useBenchmarksPage();
  const {
    providers,
    rows,
    isLoading,
    error,
    isDatasetMissing,
    syncStatusLabel,
    syncCooldownLabel,
    syncLastError,
    isSyncRunning,
    source,
    sourceUrl,
    fetchedAt,
    selectedIds,
    activeUseCase,
    toggleModel,
    clearAll,
    setUseCase,
    compareTop3,
    sortedByUseCase,
    search,
    provider,
    showConfiguredOnly,
    minIntelligence,
    maxBlendedPrice,
    sortField,
    sortDirection,
    setSearch,
    setProvider,
    setShowConfiguredOnly,
    setMinIntelligence,
    setMaxBlendedPrice,
    setSortField,
    setSortDirection,
    pagination,
    page: currentPage,
    pageSize,
    goToPage,
    changePageSize,
    applyFilters,
  } = page;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
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
          <p className="text-sm text-muted-foreground">
            This deprecated surface is read-only. Sync benchmarks and manage
            aliases in apps/ui.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Search model</p>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onBlur={applyFilters}
                placeholder="gpt-4.1, claude..."
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Provider</p>
              <Select
                value={provider}
                onValueChange={(value) => {
                  setProvider(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  {providers.map((providerName: string) => (
                    <SelectItem key={providerName} value={providerName}>
                      {providerName}
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
                onBlur={applyFilters}
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
                onBlur={applyFilters}
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
            <div className="flex items-center gap-2 ml-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="flex items-center gap-2 cursor-help">
                      <Switch
                        checked={showConfiguredOnly}
                        onCheckedChange={setShowConfiguredOnly}
                      />
                      local only
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>Show configured models only</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm text-muted-foreground">
                This deprecated surface is read-only. Manage aliases in apps/ui.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all-models">
        <TabsList variant="line">
          <TabsTrigger value="all-models">All models</TabsTrigger>
          <TabsTrigger value="compare">Comparisons</TabsTrigger>
        </TabsList>

        <TabsContent value="all-models">
          <Card>
            <CardContent className="pt-2">
              {isDatasetMissing ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <EmptyState
                    title="No benchmark snapshot yet"
                    description="Start a sync to fetch the latest Artificial Analysis dataset."
                    className="py-0"
                  />
                  <p className="text-sm text-muted-foreground">
                    Start a sync from apps/ui.
                  </p>
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
                  description="Try disabling configured-only or broadening the filter values."
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">
                          Intelligence
                        </TableHead>
                        <TableHead className="text-right">Coding</TableHead>
                        <TableHead className="text-right">Math</TableHead>
                        <TableHead className="text-right">
                          Price (3:1)
                        </TableHead>
                        <TableHead className="text-right">Speed</TableHead>
                        <TableHead className="text-right">TTFT</TableHead>
                        <TableHead className="text-right">Compare</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row: ModelBenchmarkListItem) => (
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
                            {formatLatencySeconds(
                              row.medianTimeToFirstTokenSeconds,
                            )}
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
                              {selectedIds.includes(row.id)
                                ? "Added"
                                : "Compare"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <LogsPaginationControls
                    page={currentPage}
                    pageSize={pageSize}
                    pagination={pagination}
                    onPageChange={goToPage}
                    onPageSizeChange={(value) => changePageSize(Number(value))}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compare Models</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <UseCaseFilter
                activeUseCase={activeUseCase}
                onUseCaseChange={setUseCase}
                onCompareTop3={() =>
                  compareTop3(
                    rows.map((row: ModelBenchmarkListItem) => row.id),
                    (id) => {
                      const card = sortedByUseCase.find(
                        (cardItem) => cardItem.model.id === id,
                      );
                      return card ? card.useCaseScores[activeUseCase] : 0;
                    },
                  )
                }
                selectedCount={selectedIds.length}
                totalCount={Math.min(3, rows.length)}
                onClearAll={clearAll}
              />
            </CardContent>
          </Card>

          <ComparisonDeck
            cards={sortedByUseCase}
            activeUseCase={activeUseCase}
            selectedIds={selectedIds}
          />

          <p className="text-xs text-muted-foreground px-1">
            Showing {sortedByUseCase.length} model
            {sortedByUseCase.length !== 1 ? "s" : ""} sorted by{" "}
            <span className="font-medium capitalize">
              {activeUseCase.replace(/([A-Z])/g, " $1").trim()}
            </span>
            . Select models from the "All models" tab to compare specific ones.
          </p>
        </TabsContent>
      </Tabs>

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
