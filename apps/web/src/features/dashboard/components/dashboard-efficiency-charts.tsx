import type {
  CostEfficiencyItem,
  DailyTokenTrendItem,
} from "@/features/dashboard/types/dashboard-types";
import { ModelEfficiencyChart } from "./model-efficiency-chart";
import { TokenTrendChart } from "./token-trend-chart";
import { TokensPerRequestChart } from "./tokens-per-request-chart";
import { EfficiencyVsSpeedChart } from "./efficiency-vs-speed-chart";

type DashboardEfficiencyChartsProps = {
  loading: boolean;
  rangeLabel: string;
  costEfficiency: CostEfficiencyItem[];
  dailyTokenTrend: DailyTokenTrendItem[];
  modelStatistics: {
    model: string;
    avg_tokens_per_second: number;
    total_tokens: number;
  }[];
};

export function DashboardEfficiencyCharts({
  loading,
  rangeLabel,
  costEfficiency,
  dailyTokenTrend,
  modelStatistics,
}: DashboardEfficiencyChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ModelEfficiencyChart
        loading={loading}
        costEfficiency={costEfficiency}
      />
      <TokenTrendChart
        loading={loading}
        rangeLabel={rangeLabel}
        dailyTokenTrend={dailyTokenTrend}
      />
      <TokensPerRequestChart
        loading={loading}
        rangeLabel={rangeLabel}
        dailyTokenTrend={dailyTokenTrend}
      />
      <EfficiencyVsSpeedChart
        loading={loading}
        rangeLabel={rangeLabel}
        costEfficiency={costEfficiency}
        modelStatistics={modelStatistics}
      />
    </div>
  );
}
