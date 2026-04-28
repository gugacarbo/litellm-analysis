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
  tokenDistribution: TokenDistributionItem[];
  dailyTrend: DailyTrendItem[];
  modelDistribution: ModelDistributionItem[];
  hourlyPatterns: HourlyPatternItem[];
};

export function DashboardUsageCharts(props: DashboardUsageChartsProps) {
  const {
    loading,
    rangeLabel,
    tokenDistribution,
    dailyTrend,
    modelDistribution,
    hourlyPatterns,
  } = props;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenDistributionChart
          data={tokenDistribution}
          loading={loading}
          rangeLabel={rangeLabel}
        />
        <DailySpendChart
          data={dailyTrend}
          loading={loading}
          rangeLabel={rangeLabel}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelDistributionChart
          data={modelDistribution}
          loading={loading}
          rangeLabel={rangeLabel}
        />
        <HourlyPatternChart
          data={hourlyPatterns}
          loading={loading}
          rangeLabel={rangeLabel}
        />
      </div>
    </>
  );
}
