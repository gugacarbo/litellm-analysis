import type {
  DailyTrendItem,
  HourlyPatternItem,
  ModelDistributionItem,
  TokenDistributionItem,
} from "../types/dashboard-types";
import { DailySpendChart } from "./usage-charts/daily-spend-chart";
import { HourlyPatternChart } from "./usage-charts/hourly-pattern-chart";
import { ModelDistributionChart } from "./usage-charts/model-distribution-chart";
import { TokenDistributionChart } from "./usage-charts/token-distribution-chart";

type DashboardUsageChartsProps = {
  loading: boolean;
  variant?: "usage" | "models";
  tokenDistribution: TokenDistributionItem[];
  dailyTrend: DailyTrendItem[];
  modelDistribution: ModelDistributionItem[];
  hourlyPatterns: HourlyPatternItem[];
};

export function DashboardUsageCharts({
  loading,
  variant = "usage",
  tokenDistribution,
  dailyTrend,
  modelDistribution,
  hourlyPatterns,
}: DashboardUsageChartsProps) {
  const showUsage = variant === "usage";
  const showModels = variant === "models";

  return (
    <>
      {showUsage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailySpendChart data={dailyTrend} loading={loading} />
          <HourlyPatternChart data={hourlyPatterns} loading={loading} />
        </div>
      )}
      {showModels && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TokenDistributionChart data={tokenDistribution} loading={loading} />
          <ModelDistributionChart data={modelDistribution} loading={loading} />
        </div>
      )}
    </>
  );
}
