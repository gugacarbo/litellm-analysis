import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { DailySpendChart } from "./dashboard-usage-charts/daily-spend-chart";
import { HourlyPatternChart } from "./dashboard-usage-charts/hourly-pattern-chart";
import { ModelDistributionChart } from "./dashboard-usage-charts/model-distribution-chart";
import { TokenDistributionChart } from "./dashboard-usage-charts/token-distribution-chart";
export function DashboardUsageCharts({
  loading,
  rangeLabel,
  variant = "usage",
  tokenDistribution,
  dailyTrend,
  modelDistribution,
  hourlyPatterns,
}) {
  const showUsage = variant === "usage";
  const showModels = variant === "models";
  return _jsxs(_Fragment, {
    children: [
      showUsage &&
        _jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
          children: [
            _jsx(DailySpendChart, {
              data: dailyTrend,
              loading: loading,
              rangeLabel: rangeLabel,
            }),
            _jsx(HourlyPatternChart, {
              data: hourlyPatterns,
              loading: loading,
              rangeLabel: rangeLabel,
            }),
          ],
        }),
      showModels &&
        _jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
          children: [
            _jsx(TokenDistributionChart, {
              data: tokenDistribution,
              loading: loading,
              rangeLabel: rangeLabel,
            }),
            _jsx(ModelDistributionChart, {
              data: modelDistribution,
              loading: loading,
              rangeLabel: rangeLabel,
            }),
          ],
        }),
    ],
  });
}
