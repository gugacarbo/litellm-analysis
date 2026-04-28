import { ArrowLeft, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import {
  ModelDetailErrorBreakdown,
} from "../components/model-detail/model-detail-error-breakdown";
import {
  ModelDetailErrorTrendChart,
} from "../components/model-detail/model-detail-error-trend-chart";
import {
  ModelDetailHourlyChart,
} from "../components/model-detail/model-detail-hourly-chart";
import {
  ModelDetailLatencyChart,
} from "../components/model-detail/model-detail-latency-chart";
import {
  ModelDetailSummaryCards,
} from "../components/model-detail/model-detail-summary-cards";
import {
  ModelDetailTokenBreakdown,
} from "../components/model-detail/model-detail-token-breakdown";
import { ModelDetailTrendChart } from "../components/model-detail/model-detail-trend-chart";
import {
  ModelDetailUserTable,
} from "../components/model-detail/model-detail-user-table";
import {
  ModelDetailApiKeyTable,
} from "../components/model-detail/model-detail-api-key-table";
import { useModelDetailData } from "../hooks/use-model-detail-data";
import type { DashboardDateRangeKey } from "./dashboard/dashboard-types";
import {
  DASHBOARD_DATE_RANGES,
  getDateRangeDays,
} from "./dashboard/dashboard-utils";

export function ModelDetailPage() {
  const { modelName } = useParams<{ modelName: string }>();
  const [selectedDateRange, setSelectedDateRange] = useState<DashboardDateRangeKey>("30d");
  const days = getDateRangeDays(selectedDateRange);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 flex-wrap">
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
        </div>

        <div className="flex items-center gap-2">
          {DASHBOARD_DATE_RANGES.map((range) => (
            <Button
              key={range.key}
              variant={selectedDateRange === range.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDateRange(range.key)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            Error loading data: {error}
          </p>
        </div>
      )}

      <ModelDetailSummaryCards summary={summary} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelDetailTrendChart data={dailySpendTrend} loading={loading} />
        <ModelDetailLatencyChart data={latencyTrend} loading={loading} />
        <ModelDetailTokenBreakdown data={dailyTokenTrend} loading={loading} />
        <ModelDetailErrorBreakdown data={errorBreakdown} loading={loading} />
        <ModelDetailHourlyChart data={hourlyUsage} loading={loading} />
        <ModelDetailErrorTrendChart data={dailyErrorTrend} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelDetailUserTable users={topUsers} loading={loading} />
        <ModelDetailApiKeyTable apiKeys={topApiKeys} loading={loading} />
      </div>
    </div>
  );
}

export default ModelDetailPage;
