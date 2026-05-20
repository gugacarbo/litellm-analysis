import type {
  CostEfficiencyItem,
  DailyTokenTrendItem,
} from "@/features/dashboard/types/dashboard-types";
import { EfficiencyVsSpeedChart } from "./efficiency-vs-speed-chart";
import { ModelEfficiencyChart } from "./model-efficiency-chart";
import { TokenTrendChart } from "./token-trend-chart";
import { TokensPerRequestChart } from "./tokens-per-request-chart";

type DashboardEfficiencyChartsProps = {
  loading: boolean;
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
  costEfficiency,
  dailyTokenTrend,
  modelStatistics,
}: DashboardEfficiencyChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ModelEfficiencyChart loading={loading} costEfficiency={costEfficiency} />
      <TokenTrendChart loading={loading} dailyTokenTrend={dailyTokenTrend} />
      <TokensPerRequestChart
        loading={loading}
        dailyTokenTrend={dailyTokenTrend}
      />
      <EfficiencyVsSpeedChart
        loading={loading}
        costEfficiency={costEfficiency}
        modelStatistics={modelStatistics}
      />
    </div>
  );
}
