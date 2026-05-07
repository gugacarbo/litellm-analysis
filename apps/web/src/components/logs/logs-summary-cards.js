import {
  Activity,
  Clock,
  DollarSign,
  Gauge,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
} from "../../lib/spend-log-utils";
import { MetricCard } from "../metric-card";
export function LogsSummaryCards({ logs, loading }) {
  const metrics = useMemo(() => {
    if (logs.length === 0) return null;
    const totalSpend = logs.reduce((s, l) => s + l.spend, 0);
    const totalTokens = logs.reduce((s, l) => s + l.total_tokens, 0);
    const totalRequests = logs.length;
    const avgSpend = totalSpend / totalRequests;
    const successCount = logs.filter(
      (l) => l.status === "200" || l.status === "success",
    ).length;
    const successRate = (successCount / totalRequests) * 100;
    const durations = logs
      .filter((l) => l.end_time)
      .map(
        (l) =>
          new Date(l.end_time).getTime() - new Date(l.start_time).getTime(),
      );
    const avgDuration =
      durations.length > 0
        ? durations.reduce((s, d) => s + d, 0) / durations.length
        : 0;
    const speeds = logs
      .filter((l) => l.end_time && l.completion_tokens > 0)
      .map((l) => {
        const ms =
          new Date(l.end_time).getTime() - new Date(l.start_time).getTime();
        return ms > 0 ? (l.completion_tokens / ms) * 1000 : 0;
      });
    const avgSpeed =
      speeds.length > 0 ? speeds.reduce((s, v) => s + v, 0) / speeds.length : 0;
    const avgTokensPerRequest = totalTokens / totalRequests;
    const maxTokensPerSecond = speeds.length > 0 ? Math.max(...speeds) : 0;
    const slowestRequest = logs
      .filter((l) => l.end_time)
      .map((l) => ({
        id: l.request_id,
        duration:
          new Date(l.end_time).getTime() - new Date(l.start_time).getTime(),
      }))
      .sort((a, b) => b.duration - a.duration)[0].duration;
    const topTotalTokens = logs.sort(
      (a, b) => b.total_tokens - a.total_tokens,
    )[0].total_tokens;
    return {
      totalSpend,
      totalTokens,
      totalRequests,
      avgSpend,
      avgDuration,
      avgTokensPerRequest,
      successRate,
      avgSpeed,
      maxTokensPerSecond,
      slowestRequest,
      topTotalTokens,
    };
  }, [logs]);
  if (!metrics) return null;
  return _jsxs("div", {
    className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2",
    children: [
      _jsx(MetricCard, {
        icon: DollarSign,
        title: "Total Spend",
        value: formatCurrency(metrics.totalSpend),
        description: _jsxs("span", {
          children: [
            _jsx("span", { children: formatCurrency(metrics.avgSpend) }),
            _jsx("small", { children: "/req" }),
            " ",
            _jsx("span", { children: "avg" }),
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
        value: formatNumber(metrics.totalTokens),
        description: `${formatNumber(metrics.avgTokensPerRequest)}/req`,
        colorScheme: "blue",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Gauge,
        title: "Requests",
        value: metrics.totalRequests,
        description: `${metrics.successRate.toFixed(1)}% success`,
        colorScheme: "violet",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Clock,
        title: "Avg Duration",
        value: formatDuration(metrics.avgDuration),
        description: `${formatDuration(metrics.slowestRequest)} slowest`,
        colorScheme: "neutral",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Activity,
        title: "Avg Tokens",
        value: formatNumber(metrics.avgTokensPerRequest),
        description: `${formatNumber(metrics.topTotalTokens)} max in a req`,
        colorScheme: "cyan",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Zap,
        title: "Avg Speed",
        value: `${metrics.avgSpeed.toFixed(1)} tok/s`,
        description: `max ${formatNumber(metrics.maxTokensPerSecond)} tok/s`,
        colorScheme: "violet",
        variant: "gradient",
        size: "sm",
        loading: loading,
      }),
    ],
  });
}
