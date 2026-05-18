import type {
  DailyTrendItem,
  HourlyPatternItem,
  ModelDistributionItem,
  TokenDistributionItem,
} from "../../pages/dashboard/dashboard-types";
import { DailySpendChart } from "./dashboard-usage-charts/daily-spend-chart";
import { HourlyPatternChart } from "./dashboard-usage-charts/hourly-pattern-chart";
import { ModelDistributionChart } from "./dashboard-usage-charts/model-distribution-chart";
import { TokenDistributionChart } from "./dashboard-usage-charts/token-distribution-chart";

type DashboardUsageChartsProps = {
  loading: boolean;
  rangeLabel: string;
  variant?: "usage" | "models";
  tokenDistribution: TokenDistributionItem[];
  dailyTrend: DailyTrendItem[];
  modelDistribution: ModelDistributionItem[];
  hourlyPatterns: HourlyPatternItem[];
};

export function DashboardUsageCharts({
  loading,
  rangeLabel,
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
          <DailySpendChart
            data={dailyTrend}
            loading={loading}
            rangeLabel={rangeLabel}
          />
          <HourlyPatternChart
            data={hourlyPatterns}
            loading={loading}
            rangeLabel={rangeLabel}
          />
        </div>
      )}
      {showModels && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TokenDistributionChart
            data={tokenDistribution}
            loading={loading}
            rangeLabel={rangeLabel}
          />
          <ModelDistributionChart
            data={modelDistribution}
            loading={loading}
            rangeLabel={rangeLabel}
          />
        </div>
      )}
    </>
  );
}
