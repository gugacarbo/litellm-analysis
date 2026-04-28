import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { ModelDetailErrorBreakdown } from "../components/model-detail/model-detail-error-breakdown";
import { ModelDetailLatencyChart } from "../components/model-detail/model-detail-latency-chart";
import { ModelDetailSummaryCards } from "../components/model-detail/model-detail-summary-cards";
import { ModelDetailTokenBreakdown } from "../components/model-detail/model-detail-token-breakdown";
import { ModelDetailTrendChart } from "../components/model-detail/model-detail-trend-chart";
import { ModelDetailUserTable } from "../components/model-detail/model-detail-user-table";
import { useModelDetailData } from "../hooks/use-model-detail-data";
import type { DashboardDateRangeKey } from "./dashboard/dashboard-types";
import { getDateRangeDays } from "./dashboard/dashboard-utils";

export function ModelDetailPage() {
  const { modelName } = useParams<{ modelName: string }>();
  const [selectedDateRange] = useState<DashboardDateRangeKey>("30d");
  const days = getDateRangeDays(selectedDateRange);

  const {
    summary,
    dailySpendTrend,
    dailyTokenTrend,
    latencyTrend,
    errorBreakdown,
    topUsers,
    loading,
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/model-stats">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {modelName}
        </Badge>
      </div>

      <ModelDetailSummaryCards summary={summary} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelDetailTrendChart data={dailySpendTrend} loading={loading} />
        <ModelDetailLatencyChart data={latencyTrend} loading={loading} />
        <ModelDetailTokenBreakdown data={dailyTokenTrend} loading={loading} />
        <ModelDetailErrorBreakdown data={errorBreakdown} loading={loading} />
      </div>

      <ModelDetailUserTable users={topUsers} loading={loading} />
    </div>
  );
}

export default ModelDetailPage;
