import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PageLayout } from "../components/layout/page-layout/page-layout";
import { ModelDetailApiKeyTable } from "../components/model-detail/model-detail-api-key-table";
import { ModelDetailCostChart } from "../components/model-detail/model-detail-cost-chart";
import { ModelDetailErrorBreakdown } from "../components/model-detail/model-detail-error-breakdown";
import { ModelDetailErrorTrendChart } from "../components/model-detail/model-detail-error-trend-chart";
import { ModelDetailHourlyChart } from "../components/model-detail/model-detail-hourly-chart";
import { ModelDetailLatencyChart } from "../components/model-detail/model-detail-latency-chart";
import { ModelDetailLogsPanel } from "../components/model-detail/model-detail-logs-panel";
import { ModelDetailProviderChart } from "../components/model-detail/model-detail-provider-chart";
import { ModelDetailStatusChart } from "../components/model-detail/model-detail-status-chart";
import { ModelDetailSummaryCards } from "../components/model-detail/model-detail-summary-cards";
import { ModelDetailTokenEfficiency } from "../components/model-detail/model-detail-token-efficiency";
import { ModelDetailTrendChart } from "../components/model-detail/model-detail-trend-chart";
import { ModelDetailTTFTChart } from "../components/model-detail/model-detail-ttft-chart";
import { ModelDetailUserTable } from "../components/model-detail/model-detail-user-table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { TimeRangePicker } from "../components/ui/time-range-picker";
import { useModelDetailData } from "../hooks/use-model-detail-data";
import type {
  DashboardDateRangeKey,
  TimeRangeValue,
} from "./dashboard/dashboard-types";
import { getDateRangeDays } from "./dashboard/dashboard-utils";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from "./model-detail/model-detail-utils";

function getRangeLabel(
  rangeKey: string,
  fromIso: string | null,
  toIso: string | null,
): string {
  const labels: Record<string, string> = {
    "1h": "Last hour",
    "6h": "Last 6 hours",
    "24h": "Last 24 hours",
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "60d": "Last 60 days",
    "90d": "Last 90 days",
    all: "All time",
  };
  if (rangeKey === "custom" && fromIso && toIso) {
    const from = new Date(fromIso).toLocaleDateString();
    const to = new Date(toIso).toLocaleDateString();
    return `${from} — ${to}`;
  }
  return labels[rangeKey] ?? rangeKey;
}

function getHealthLabel(successRate: number, errorCount: number): string {
  if (successRate >= 99 && errorCount === 0) return "Excellent";
  if (successRate >= 97) return "Healthy";
  if (successRate >= 92) return "Watch";
  return "Unstable";
}

function getHealthBadgeVariant(
  successRate: number,
  errorCount: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (successRate >= 99 && errorCount === 0) return "default";
  if (successRate >= 97) return "secondary";
  if (successRate >= 92) return "outline";
  return "destructive";
}

const MODEL_DETAIL_TABS = new Set([
  "overview",
  "performance",
  "reliability",
  "usage",
  "logs",
]);

export function ModelDetailPage() {
  const { modelName } = useParams<{ modelName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const rangeKey = searchParams.get("range") ?? "30d";
  const fromIso = searchParams.get("from");
  const toIso = searchParams.get("to");
  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam && MODEL_DETAIL_TABS.has(tabParam) ? tabParam : "overview";

  const days = useMemo(() => {
    if (rangeKey === "custom" && fromIso && toIso) {
      const diffMs = new Date(toIso).getTime() - new Date(fromIso).getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    }
    return getDateRangeDays(rangeKey as DashboardDateRangeKey);
  }, [rangeKey, fromIso, toIso]);

  const rangeLabel = useMemo(
    () => getRangeLabel(rangeKey, fromIso, toIso),
    [rangeKey, fromIso, toIso],
  );

  const timeRangeValue: TimeRangeValue = useMemo(() => {
    if (rangeKey === "custom" && fromIso && toIso) {
      return { preset: "custom", from: new Date(fromIso), to: new Date(toIso) };
    }
    return { preset: rangeKey as DashboardDateRangeKey };
  }, [rangeKey, fromIso, toIso]);

  const handleTimeRangeChange = useCallback(
    (newValue: TimeRangeValue) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (newValue.preset === "custom" && newValue.from && newValue.to) {
            params.set("range", "custom");
            params.set("from", newValue.from.toISOString());
            params.set("to", newValue.to.toISOString());
          } else if (newValue.preset) {
            params.set("range", newValue.preset);
            params.delete("from");
            params.delete("to");
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("tab", tab);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const {
    summary,
    dailySpendTrend,
    dailyTokenTrend,
    latencyTrend,
    errorBreakdown,
    dailyErrorTrend,
    hourlyUsage,
    topUsers,
    topApiKeys,
    cacheHitRate,
    ttft,
    statusDistribution,
    providerBreakdown,
    loading,
    error,
  } = useModelDetailData(modelName ?? "", days);

  if (!modelName) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Model not specified</p>
      </div>
    );
  }

  const modelHealthLabel = summary
    ? getHealthLabel(summary.successRate, summary.errorCount)
    : "Unknown";

  const healthBadgeVariant = summary
    ? getHealthBadgeVariant(summary.successRate, summary.errorCount)
    : "outline";

  return (
    <PageLayout
      title="Model Detail"
      subtitle="Deep diagnostics for a single model, with focused analytics and request logs."
      icon={TrendingUp}
      showFilters={false}
      buttons={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/model-stats">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Badge variant="outline" className="text-sm px-3 py-1 font-mono">
            {modelName}
          </Badge>
          {loading && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TimeRangePicker
            value={timeRangeValue}
            onChange={handleTimeRangeChange}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Window: {rangeLabel}</Badge>
            <Badge variant={healthBadgeVariant}>{modelHealthLabel}</Badge>
          </div>
        </div>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-cyan-500/5">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Focused Model Snapshot
                </p>
                <h2 className="text-xl font-semibold">{modelName}</h2>
              </div>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {summary ? `#${summary.rank} by spend` : "Ranking unavailable"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Spend share</p>
                <p className="text-base font-semibold">
                  {summary ? formatPercent(summary.percentOfTotal) : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Success rate</p>
                <p className="text-base font-semibold">
                  {summary ? formatPercent(summary.successRate) : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Avg latency</p>
                <p className="text-base font-semibold">
                  {summary ? formatDuration(summary.avgLatencyMs) : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">
                  Cost / 1k tokens
                </p>
                <p className="text-base font-semibold">
                  {summary ? formatCurrency(summary.costPer1kTokens) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="inline-flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Error loading data: {error}
            </p>
          </div>
        )}

        <ModelDetailSummaryCards
          summary={summary}
          cacheHitRate={cacheHitRate}
          ttft={ttft}
          loading={loading}
          days={Math.max(1, days)}
        />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reliability">Reliability</TabsTrigger>
            <TabsTrigger value="usage">Usage & Access</TabsTrigger>
            <TabsTrigger value="logs">Model Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ModelDetailCostChart
                data={dailySpendTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailTokenEfficiency
                data={dailyTokenTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ModelDetailTrendChart
                data={dailySpendTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailHourlyChart
                data={hourlyUsage}
                loading={loading}
                rangeLabel={rangeLabel}
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ModelDetailLatencyChart
                data={latencyTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailTTFTChart data={ttft} loading={loading} />
            </div>
            <ModelDetailProviderChart
              data={providerBreakdown}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="reliability" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ModelDetailErrorBreakdown
                data={errorBreakdown}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailErrorTrendChart
                data={dailyErrorTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailStatusChart
                data={statusDistribution}
                loading={loading}
              />
            </div>
            <Card>
              <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total requests
                  </p>
                  <p className="text-sm font-medium">
                    {summary ? formatNumber(summary.totalRequests) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                  <p className="text-sm font-medium">
                    {summary ? formatNumber(summary.errorCount) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">First seen</p>
                  <p className="text-sm font-medium">
                    {summary?.firstSeen
                      ? new Date(summary.firstSeen).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last seen</p>
                  <p className="text-sm font-medium">
                    {summary?.lastSeen
                      ? new Date(summary.lastSeen).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ModelDetailUserTable
                users={topUsers}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailApiKeyTable
                apiKeys={topApiKeys}
                loading={loading}
                rangeLabel={rangeLabel}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Unique users</p>
                  <p className="text-lg font-semibold">
                    {summary ? formatNumber(summary.uniqueUsers) : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Unique API keys
                  </p>
                  <p className="text-lg font-semibold">
                    {summary ? formatNumber(summary.uniqueApiKeys) : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total tokens</p>
                  <p className="text-lg font-semibold">
                    {summary ? formatNumber(summary.totalTokens) : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <ModelDetailLogsPanel
              modelName={modelName}
              defaultStartDate={fromIso}
              defaultEndDate={toIso}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

export default ModelDetailPage;
