import {
  Activity,
  CheckCircle,
  Clock,
  DollarSign,
  Gauge,
  Sparkles,
} from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
} from "../../pages/model-stats/model-stats-utils";
import { MetricCard } from "../metric-card";
export function ModelStatsSummaryCards({
  loading,
  totalSpend,
  totalRequests,
  totalTokens,
  avgSuccessRate,
  totalErrors,
  avgLatency,
  avgCostPerRequest,
  uniqueModels,
  maxTokensPerSecond,
  rangeLabel,
}) {
  return _jsxs("div", {
    className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3",
    children: [
      _jsx(MetricCard, {
        icon: DollarSign,
        title: "Total Spend",
        value: formatCurrency(totalSpend),
        description: _jsxs("span", {
          children: [
            _jsx("span", { children: formatCurrency(avgCostPerRequest) }),
            _jsx("small", { children: " avg/req" }),
          ],
        }),
        colorScheme: "green",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Sparkles,
        title: "Total Tokens",
        value: formatCompactNumber(totalTokens),
        description: _jsxs("span", {
          children: [
            _jsx("span", { children: formatCompactNumber(totalRequests) }),
            _jsx("small", { children: " requests" }),
          ],
        }),
        colorScheme: "blue",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Gauge,
        title: "Requests",
        value: formatCompactNumber(totalRequests),
        description: _jsxs("span", {
          children: [
            _jsx("span", { children: formatPercent(avgSuccessRate) }),
            _jsx("small", { children: " success" }),
          ],
        }),
        colorScheme: "violet",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: CheckCircle,
        title: "Success Rate",
        value: formatPercent(avgSuccessRate),
        description: _jsxs("span", {
          children: [
            _jsx("span", { children: formatCompactNumber(totalErrors) }),
            _jsx("small", { children: " errors" }),
          ],
        }),
        colorScheme: "green",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Clock,
        title: "Avg Latency",
        value: formatDuration(avgLatency),
        description: _jsxs("span", {
          children: [
            _jsx("span", { children: formatCompactNumber(maxTokensPerSecond) }),
            _jsx("small", { children: " max tok/s" }),
          ],
        }),
        colorScheme: "neutral",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Activity,
        title: "Models",
        value: formatCompactNumber(uniqueModels),
        description: rangeLabel,
        colorScheme: "cyan",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
    ],
  });
}
