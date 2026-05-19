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
import type {
  ModelCacheHitRate,
  ModelDetailSummary,
  ModelTTFTPercentiles,
} from "@/features/models/detail/model-detail-types";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/features/models/detail/model-detail-utils";
import { MetricCard } from "../metric-card";

type Props = {
  summary: ModelDetailSummary | null;
  cacheHitRate: ModelCacheHitRate | null;
  ttft: ModelTTFTPercentiles | null;
  loading: boolean;
  days: number;
};

export function ModelDetailSummaryCards({
  summary,
  cacheHitRate,
  ttft,
  loading,
  days,
}: Props) {
  const tokensPerSecond =
    summary && days > 0 ? summary.totalTokens / (days * 86_400) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          title="Total Spend"
          value={summary ? formatCurrency(summary.totalSpend) : "—"}
          icon={DollarSign}
          variant="gradient"
          colorScheme="blue"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Requests"
          value={summary ? formatNumber(summary.totalRequests) : "—"}
          icon={Activity}
          variant="gradient"
          colorScheme="green"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Total Tokens"
          value={summary ? formatNumber(summary.totalTokens) : "—"}
          icon={Database}
          variant="gradient"
          colorScheme="violet"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Avg Latency"
          value={summary ? formatDuration(summary.avgLatencyMs) : "—"}
          icon={Timer}
          variant="gradient"
          colorScheme="amber"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Success Rate"
          value={summary ? formatPercent(summary.successRate) : "—"}
          icon={ShieldCheck}
          variant="gradient"
          colorScheme="cyan"
          size="sm"
          loading={loading}
          progress={
            summary
              ? { value: summary.successRate, max: 100, label: "Success Rate" }
              : undefined
          }
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          title="Errors"
          value={summary ? formatNumber(summary.errorCount) : "—"}
          icon={AlertCircle}
          variant="gradient"
          colorScheme="red"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Unique Users"
          value={summary ? formatNumber(summary.uniqueUsers) : "—"}
          icon={Users}
          variant="gradient"
          colorScheme="green"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Tokens/s"
          value={summary ? formatNumber(Math.round(tokensPerSecond)) : "—"}
          icon={Zap}
          variant="gradient"
          colorScheme="violet"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="Cache Hit Rate"
          value={
            cacheHitRate ? formatPercent(cacheHitRate.cache_hit_rate) : "—"
          }
          icon={Hash}
          variant="gradient"
          colorScheme="cyan"
          size="sm"
          loading={loading}
        />
        <MetricCard
          title="TTFT"
          value={ttft ? formatDuration(ttft.avg_ttft_ms) : "—"}
          icon={Cpu}
          variant="gradient"
          colorScheme="amber"
          size="sm"
          loading={loading}
        />
      </div>
    </div>
  );
}
