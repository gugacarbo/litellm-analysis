import { Filter, Scale } from "lucide-react";
import { ComparisonDeck } from "../components/benchmark/comparison-deck";
import { UseCaseFilter } from "../components/benchmark/use-case-filter";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Input } from "../components/ui/input";
import { PageLayout } from "../components/ui/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { APP_LOCALE, APP_TIMEZONE } from "../lib/locale";
import {
  formatBenchmarkPrice,
  formatLatencySeconds,
  formatNullableNumber,
  formatSpeed,
} from "./benchmarks/benchmark-utils";
import { useBenchmarksPage } from "./benchmarks/use-benchmarks-page";

function formatFetchedAt(value: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

export function BenchmarksPage() {
  const page = useBenchmarksPage();
  const {
    providers,
    rows,
    isLoading,
    error,
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
  } = page;

  return (
    <PageLayout
      title="Model Benchmarks"
      subtitle="Independent benchmark + pricing snapshot from Artificial Analysis"
      icon={Scale}
      showFilters={false}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
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
                    {providers.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Min intelligence
                </p>
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
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={showConfiguredOnly}
                  onCheckedChange={setShowConfiguredOnly}
                />
                Show configured models only
              </label>
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

        <Tabs defaultValue="all-models">
          <TabsList variant="line">
            <TabsTrigger value="all-models">All models</TabsTrigger>
            <TabsTrigger value="compare">Comparisons</TabsTrigger>
          </TabsList>

          <TabsContent value="all-models">
            <Card>
              <CardContent className="pt-2">
                {error ? (
                  <div className="py-4 text-sm text-red-500">
                    {error}. Run <code>pnpm sync:aa-benchmarks</code> and
                    refresh.
                  </div>
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
                      rows.map((r) => r.id),
                      (id) => {
                        const card = sortedByUseCase.find(
                          (c) => c.model.id === id,
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
              . Select models from the "All models" tab to compare specific
              ones.
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
    </PageLayout>
  );
}
