import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type {
  DashboardDateRangeKey,
  TimeRangeValue,
} from "@/shared/lib/date-ranges";
import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";
import { ModelDetailApiKeyTable } from "../components/model-detail/model-detail-api-key-table";
import { ModelDetailCostChart } from "../components/model-detail/model-detail-cost-chart";
import { ModelDetailErrorBreakdown } from "../components/model-detail/model-detail-error-breakdown";
import { ModelDetailErrorTrendChart } from "../components/model-detail/model-detail-error-trend-chart";
import { ModelDetailHourlyChart } from "../components/model-detail/model-detail-hourly-chart";
import { ModelDetailLatencyChart } from "../components/model-detail/model-detail-latency-chart";
import { ModelDetailProviderChart } from "../components/model-detail/model-detail-provider-chart";
import { ModelDetailStatusChart } from "../components/model-detail/model-detail-status-chart";
import { ModelDetailSummaryCards } from "../components/model-detail/model-detail-summary-cards";
import { ModelDetailTokenEfficiency } from "../components/model-detail/model-detail-token-efficiency";
import { ModelDetailTrendChart } from "../components/model-detail/model-detail-trend-chart";
import { ModelDetailTTFTChart } from "../components/model-detail/model-detail-ttft-chart";
import { ModelDetailUserTable } from "../components/model-detail/model-detail-user-table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { Separator } from "../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { TimeRangePicker } from "../components/ui/time-range-picker";
import { useModelDetailData } from "../hooks/use-model-detail-data";
import { getDateRangeDays } from "./dashboard/dashboard-utils";
import { ModelDetailLogsTab } from "./model-detail/model-detail-logs-tab";
import { useModelDetailLogs } from "./model-detail/use-model-detail-logs";

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
    const from = new Date(fromIso).toLocaleDateString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
    });
    const to = new Date(toIso).toLocaleDateString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
    });
    return `${from} — ${to}`;
  }
  return labels[rangeKey] ?? rangeKey;
}

export function ModelDetailPage() {
  const { modelName } = useParams<{ modelName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const rangeKey = searchParams.get("range") ?? "30d";
  const fromIso = searchParams.get("from");
  const toIso = searchParams.get("to");

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

  const {
    logs,
    pagination: logsPagination,
    loading: logsLoading,
    refreshing: logsRefreshing,
    error: logsError,
    page: logsPage,
    pageSize: logsPageSize,
    setPage: setLogsPage,
    setPageSize: setLogsPageSize,
    refetch: logsRefetch,
  } = useModelDetailLogs(modelName ?? "");

  if (!modelName) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Model not specified</p>
      </div>
    );
  }

  return (
    <PageLayout
      title="Model Detail"
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
          <Badge variant="outline" className="text-lg px-4 py-1">
            {modelName}
          </Badge>
          {loading && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </>
      }
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <TimeRangePicker
          value={timeRangeValue}
          onChange={handleTimeRangeChange}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Showing data for {rangeLabel}
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            Error loading data: {error}
          </p>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {/*** KPI ROWS ***/}
          <ModelDetailSummaryCards
            summary={summary}
            cacheHitRate={cacheHitRate}
            ttft={ttft}
            loading={loading}
            days={Math.max(1, days)}
          />

          {/*** COST ANALYSIS ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Cost Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModelDetailCostChart
                data={dailySpendTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
            </div>
          </section>

          <Separator />

          {/*** TOKEN ANALYTICS ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Token Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModelDetailTokenEfficiency
                data={dailyTokenTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
            </div>
          </section>

          <Separator />

          {/*** LATENCY ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Latency
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModelDetailLatencyChart
                data={latencyTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailTTFTChart data={ttft} loading={loading} />
            </div>
          </section>

          <Separator />

          {/*** RELIABILITY ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Reliability
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          </section>

          <Separator />

          {/*** USAGE PATTERNS ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Usage Patterns
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModelDetailHourlyChart
                data={hourlyUsage}
                loading={loading}
                rangeLabel={rangeLabel}
              />
              <ModelDetailTrendChart
                data={dailySpendTrend}
                loading={loading}
                rangeLabel={rangeLabel}
              />
            </div>
          </section>

          <Separator />

          {/*** PROVIDER BREAKDOWN ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Provider Breakdown
            </h2>
            <ModelDetailProviderChart
              data={providerBreakdown}
              loading={loading}
            />
          </section>

          <Separator />

          {/*** TOP ENTITIES ***/}
          <section>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Top Entities
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </section>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <ModelDetailLogsTab
            logs={logs}
            pagination={logsPagination}
            loading={logsLoading}
            refreshing={logsRefreshing}
            error={logsError}
            page={logsPage}
            pageSize={logsPageSize}
            setPage={setLogsPage}
            setPageSize={setLogsPageSize}
            refetch={logsRefetch}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
