import type {
  DailyTokenTrendItem,
  DailyTrendItem,
  DashboardInsight,
  DashboardMetrics,
  HourlyPatternItem,
  PerformanceMetrics,
} from "../../pages/dashboard/dashboard-types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  safeDivide,
} from "../../pages/dashboard/dashboard-utils";
import { getToneByDelta } from "./normalizers";

export function computeInsights(
  metrics: DashboardMetrics | null,
  performance: PerformanceMetrics | null,
  hourlyPatterns: HourlyPatternItem[],
  dailyTokenTrend: DailyTokenTrendItem[],
  dailyTrend: DailyTrendItem[],
): DashboardInsight[] {
  const totalSpend = metrics?.totalSpend ?? 0;
  const totalTokens = metrics?.totalTokens ?? 0;
  const totalRequests = performance?.total_requests ?? 0;

  const avgCostPerRequest = safeDivide(totalSpend, totalRequests);
  const avgCostPer1kTokens = safeDivide(totalSpend, totalTokens) * 1000;

  const peakHour = [...hourlyPatterns].sort(
    (a, b) => b.request_count - a.request_count,
  )[0];

  const totalInputTokens = dailyTokenTrend.reduce(
    (sum, day) => sum + Number(day.prompt_tokens || 0),
    0,
  );
  const totalOutputTokens = dailyTokenTrend.reduce(
    (sum, day) => sum + Number(day.completion_tokens || 0),
    0,
  );
  const outputShare =
    safeDivide(totalOutputTokens, totalInputTokens + totalOutputTokens) * 100;

  const recentWindow = dailyTrend.slice(-7);
  const previousWindow = dailyTrend.slice(-14, -7);
  const recentSpend = recentWindow.reduce(
    (sum, day) => sum + Number(day.spend || 0),
    0,
  );
  const previousSpend = previousWindow.reduce(
    (sum, day) => sum + Number(day.spend || 0),
    0,
  );

  const momentum =
    previousSpend > 0
      ? ((recentSpend - previousSpend) / previousSpend) * 100
      : 0;

  return [
    {
      title: "Avg cost per request",
      value: formatCurrency(avgCostPerRequest),
      detail: `${formatNumber(totalRequests)} total requests`,
      tone: "neutral",
    },
    {
      title: "Avg cost per 1K tokens",
      value: formatCurrency(avgCostPer1kTokens),
      detail: `${formatNumber(totalTokens)} tokens in selected range`,
      tone: "neutral",
    },
    {
      title: "Peak usage hour",
      value: peakHour ? `${peakHour.hour}:00` : "--",
      detail: peakHour
        ? `${formatNumber(peakHour.request_count)} requests`
        : "No hourly requests in selected range",
      tone: "positive",
    },
    {
      title: "Output token share",
      value: formatPercent(outputShare),
      detail: "Completion tokens over total token volume",
      tone: outputShare > 65 ? "warning" : "neutral",
    },
    {
      title: "Spend momentum",
      value: `${momentum >= 0 ? "+" : ""}${formatPercent(momentum)}`,
      detail: "Last 7 days compared to previous 7 days",
      tone: getToneByDelta(momentum),
    },
  ];
}
