import { Activity, Filter, Layers, ListFilter, Scale, Zap } from "lucide-react";
import { MetricCard } from "../components/metric-card";
import { Badge } from "../components/ui/badge";
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

export function BenchmarksPage() {
  const state = useBenchmarksState();

  return (
    <PageLayout
      title="Model Benchmarks"
      subtitle="Independent benchmark + pricing snapshot from Artificial Analysis"
      icon={Scale}
      showFilters={false}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            icon={Layers}
            title="Visible Models"
            value={state.rows.length}
            colorScheme="blue"
            size="sm"
            loading={state.isLoading}
          />
          <MetricCard
            icon={Activity}
            title="Configured"
            value={state.configuredCount}
            colorScheme="green"
            size="sm"
            loading={state.isLoading}
          />
          <MetricCard
            icon={ListFilter}
            title="Total in Dataset"
            value={state.totalCount}
            colorScheme="neutral"
            size="sm"
            loading={state.isLoading}
          />
          <MetricCard
            icon={Zap}
            title="Source"
            value={state.source}
            description={formatFetchedAt(state.fetchedAt)}
            colorScheme="amber"
            size="sm"
            loading={state.isLoading}
          />
        </div>

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
                    <TableHead className="text-right">Intelligence</TableHead>
                    <TableHead className="text-right">Coding</TableHead>
                    <TableHead className="text-right">Math</TableHead>
                    <TableHead className="text-right">Price (3:1)</TableHead>
                    <TableHead className="text-right">Speed</TableHead>
                    <TableHead className="text-right">TTFT</TableHead>
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
