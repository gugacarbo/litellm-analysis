import {
  Activity,
  AlertCircle,
  Cpu,
  Database,
  DollarSign,
  Hash,
  ShieldCheck,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from "../../pages/model-detail/model-detail-utils";
import { MetricCard } from "../metric-card";
export function ModelDetailSummaryCards({
  summary,
  cacheHitRate,
  ttft,
  loading,
  days,
}) {
  const tokensPerSecond =
    summary && days > 0 ? summary.totalTokens / (days * 86_400) : 0;
  return _jsxs("div", {
    className: "space-y-3",
    children: [
      _jsxs("div", {
        className: "grid grid-cols-2 md:grid-cols-5 gap-3",
        children: [
          _jsx(MetricCard, {
            title: "Total Spend",
            value: summary ? formatCurrency(summary.totalSpend) : "—",
            icon: DollarSign,
            variant: "gradient",
            colorScheme: "blue",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Requests",
            value: summary ? formatNumber(summary.totalRequests) : "—",
            icon: Activity,
            variant: "gradient",
            colorScheme: "green",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Total Tokens",
            value: summary ? formatNumber(summary.totalTokens) : "—",
            icon: Database,
            variant: "gradient",
            colorScheme: "violet",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Avg Latency",
            value: summary ? formatDuration(summary.avgLatencyMs) : "—",
            icon: Timer,
            variant: "gradient",
            colorScheme: "amber",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Success Rate",
            value: summary ? formatPercent(summary.successRate) : "—",
            icon: ShieldCheck,
            variant: "gradient",
            colorScheme: "cyan",
            size: "sm",
            loading: loading,
            progress: summary
              ? { value: summary.successRate, max: 100, label: "Success Rate" }
              : undefined,
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-2 md:grid-cols-5 gap-3",
        children: [
          _jsx(MetricCard, {
            title: "Errors",
            value: summary ? formatNumber(summary.errorCount) : "—",
            icon: AlertCircle,
            variant: "gradient",
            colorScheme: "red",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Unique Users",
            value: summary ? formatNumber(summary.uniqueUsers) : "—",
            icon: Users,
            variant: "gradient",
            colorScheme: "green",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Tokens/s",
            value: summary ? formatNumber(Math.round(tokensPerSecond)) : "—",
            icon: Zap,
            variant: "gradient",
            colorScheme: "violet",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "Cache Hit Rate",
            value: cacheHitRate
              ? formatPercent(cacheHitRate.cache_hit_rate)
              : "—",
            icon: Hash,
            variant: "gradient",
            colorScheme: "cyan",
            size: "sm",
            loading: loading,
          }),
          _jsx(MetricCard, {
            title: "TTFT",
            value: ttft ? formatDuration(ttft.avg_ttft_ms) : "—",
            icon: Cpu,
            variant: "gradient",
            colorScheme: "amber",
            size: "sm",
            loading: loading,
          }),
        ],
      }),
    ],
  });
}
