import { Filter, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { useBenchmarksState } from "./benchmarks/use-benchmarks-state";

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

function safeNumber(value: number | null): number {
  return value ?? 0;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function BenchmarksPage() {
  const state = useBenchmarksState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const compareCandidates = useMemo(
    () => state.rows.slice(0, 60),
    [state.rows],
  );

  const selectedRows = useMemo(() => {
    const byId = new Map(state.rows.map((row) => [row.id, row]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [selectedIds, state.rows]);

  const rowsForCompare = useMemo(() => {
    if (selectedRows.length > 0) return selectedRows.slice(0, 6);
    return compareCandidates.slice(0, 3);
  }, [compareCandidates, selectedRows]);

  const scoreData = useMemo(
    () =>
      rowsForCompare.map((row) => ({
        model: row.name,
        intelligence: safeNumber(row.intelligenceIndex),
        coding: safeNumber(row.codingIndex),
        math: safeNumber(row.mathIndex),
      })),
    [rowsForCompare],
  );

  const radarData = useMemo(() => {
    if (rowsForCompare.length === 0) return [];

    const metrics = [
      { key: "intelligenceIndex", label: "Intelligence", invert: false },
      { key: "codingIndex", label: "Coding", invert: false },
      { key: "mathIndex", label: "Math", invert: false },
      { key: "medianOutputTokensPerSecond", label: "Speed", invert: false },
      { key: "medianTimeToFirstTokenSeconds", label: "Latency", invert: true },
      { key: "priceBlended1mTokens", label: "Price", invert: true },
    ] as const;

    return metrics.map((metric) => {
      const values = rowsForCompare.map((row) => {
        const value = row[metric.key];
        return typeof value === "number" ? value : 0;
      });
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = Math.max(max - min, 1e-9);

      const point: Record<string, string | number> = { metric: metric.label };

      for (const row of rowsForCompare) {
        const raw = row[metric.key];
        const numeric = typeof raw === "number" ? raw : 0;
        const normalized = ((numeric - min) / span) * 100;
        point[row.id] = metric.invert ? 100 - normalized : normalized;
      }

      return point;
    });
  }, [rowsForCompare]);

  const analysis = useMemo(() => {
    if (rowsForCompare.length === 0) return null;

    const byMax = (
      pick: (row: (typeof rowsForCompare)[number]) => number | null,
    ) =>
      rowsForCompare.reduce<(typeof rowsForCompare)[number] | null>(
        (best, row) => {
          const value = pick(row);
          if (value === null) return best;
          if (!best) return row;
          const bestValue = pick(best);
          return bestValue === null || value > bestValue ? row : best;
        },
        null,
      );

    const byMin = (
      pick: (row: (typeof rowsForCompare)[number]) => number | null,
    ) =>
      rowsForCompare.reduce<(typeof rowsForCompare)[number] | null>(
        (best, row) => {
          const value = pick(row);
          if (value === null) return best;
          if (!best) return row;
          const bestValue = pick(best);
          return bestValue === null || value < bestValue ? row : best;
        },
        null,
      );

    return {
      bestIntelligence: byMax((row) => row.intelligenceIndex),
      fastest: byMax((row) => row.medianOutputTokensPerSecond),
      lowestLatency: byMin((row) => row.medianTimeToFirstTokenSeconds),
      cheapest: byMin((row) => row.priceBlended1mTokens),
      bestValue: byMax((row) => {
        if (
          row.intelligenceIndex === null ||
          row.priceBlended1mTokens === null ||
          row.priceBlended1mTokens <= 0
        ) {
          return null;
        }
        return row.intelligenceIndex / row.priceBlended1mTokens;
      }),
      mostBalanced: rowsForCompare
        .map((row) => ({
          row,
          score: avg([
            safeNumber(row.intelligenceIndex),
            safeNumber(row.codingIndex),
            safeNumber(row.mathIndex),
            safeNumber(row.medianOutputTokensPerSecond),
          ]),
        }))
        .sort((a, b) => b.score - a.score)[0]?.row,
    };
  }, [rowsForCompare]);

  const toggleModel = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 6) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  };

  const chartColors = [
    "#2563eb",
    "#059669",
    "#dc2626",
    "#d97706",
    "#7c3aed",
    "#0f766e",
  ];

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
                  value={state.search}
                  onChange={(event) => state.setSearch(event.target.value)}
                  placeholder="gpt-4.1, claude..."
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Provider</p>
                <Select
                  value={state.provider}
                  onValueChange={state.setProvider}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    {state.providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
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
                  value={state.minIntelligence}
                  onChange={(event) =>
                    state.setMinIntelligence(event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="ex: 50"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Max blended price ($/M)
                </p>
                <Input
                  value={state.maxBlendedPrice}
                  onChange={(event) =>
                    state.setMaxBlendedPrice(event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="ex: 10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={state.showConfiguredOnly}
                  onCheckedChange={state.setShowConfiguredOnly}
                />
                Show configured models only
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sort by</span>
                <Select
                  value={state.sortField}
                  onValueChange={(value) =>
                    state.setSortField(
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
                  value={state.sortDirection}
                  onValueChange={(value) =>
                    state.setSortDirection(value as "asc" | "desc")
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
                {state.error ? (
                  <div className="py-4 text-sm text-red-500">
                    {state.error}. Run <code>pnpm sync:aa-benchmarks</code> and
                    refresh.
                  </div>
                ) : state.isLoading ? (
                  <div className="space-y-2 py-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : state.rows.length === 0 ? (
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
                      {state.rows.map((row) => (
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
                <CardTitle className="text-sm">
                  Selected models ({rowsForCompare.length}/6)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Pick up to 6 models to compare. If none is selected, we use
                  the first 3 models from your current filters.
                </p>
                <div className="flex flex-wrap gap-2">
                  {compareCandidates.map((row) => (
                    <Button
                      key={row.id}
                      size="sm"
                      variant={
                        selectedIds.includes(row.id) ? "secondary" : "outline"
                      }
                      onClick={() => toggleModel(row.id)}
                    >
                      {row.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Core benchmarks (Intelligence, Coding, Math)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="intelligence" fill="#2563eb" />
                      <Bar dataKey="coding" fill="#059669" />
                      <Bar dataKey="math" fill="#d97706" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Balanced profile (normalized 0-100)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {rowsForCompare.map((row, index) => (
                        <Radar
                          key={row.id}
                          name={row.name}
                          dataKey={row.id}
                          stroke={chartColors[index % chartColors.length]}
                          fill={chartColors[index % chartColors.length]}
                          fillOpacity={0.15}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Automatic analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Best intelligence:{" "}
                  <span className="font-medium">
                    {analysis?.bestIntelligence?.name ?? "N/A"}
                  </span>
                </p>
                <p>
                  Fastest generation:{" "}
                  <span className="font-medium">
                    {analysis?.fastest?.name ?? "N/A"}
                  </span>
                </p>
                <p>
                  Lowest latency (TTFT):{" "}
                  <span className="font-medium">
                    {analysis?.lowestLatency?.name ?? "N/A"}
                  </span>
                </p>
                <p>
                  Cheapest blended price:{" "}
                  <span className="font-medium">
                    {analysis?.cheapest?.name ?? "N/A"}
                  </span>
                </p>
                <p>
                  Best intelligence/price ratio:{" "}
                  <span className="font-medium">
                    {analysis?.bestValue?.name ?? "N/A"}
                  </span>
                </p>
                <p>
                  Most balanced profile:{" "}
                  <span className="font-medium">
                    {analysis?.mostBalanced?.name ?? "N/A"}
                  </span>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          Data from{" "}
          <a
            href={state.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {state.source}
          </a>
          . Last update: {formatFetchedAt(state.fetchedAt)}.
        </p>
      </div>
    </PageLayout>
  );
}
