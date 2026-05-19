import { Clock, DollarSign, Gauge, Sparkles, TrendingUp } from "lucide-react";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
  formatTokensPerSecond,
} from "@/features/model-stats/model-stats-utils";
import { MetricCard } from "../metric-card";

type ModelStatsSummaryCardsProps = {
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  totalCompletionTokens: number;
  avgSuccessRate: number;
  avgLatency: number;
  avgTokensPerSecond: number;
  avgCostPerRequest: number;
  avgCostPer1kTokens: number;
  topSpendModel: string;
  topSpendValue: number;
  maxTokensPerSecond: number;
  topEfficiencyModel: string;
  bestCostPer1k: number;
};

export function ModelStatsSummaryCards({
  loading,
  totalSpend,
  totalRequests,
  totalTokens,
  totalCompletionTokens,
  avgSuccessRate,
  avgLatency,
  avgTokensPerSecond,
  avgCostPerRequest,
  avgCostPer1kTokens,
  topSpendModel,
  topSpendValue,
  maxTokensPerSecond,
  topEfficiencyModel,
  bestCostPer1k,
}: ModelStatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
      <MetricCard
        icon={DollarSign}
        title="Total Spend"
        value={formatCurrency(totalSpend)}
        description={
          <span>
            <span>{formatCurrency(avgCostPerRequest)}</span>
            <small> avg/req</small>
          </span>
        }
        colorScheme="green"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={Sparkles}
        title="Total Tokens"
        value={formatCompactNumber(totalTokens)}
        description={
          <span>
            <span>{formatCompactNumber(totalCompletionTokens)}</span>
            <small> output tokens</small>
          </span>
        }
        colorScheme="blue"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={Gauge}
        title="Requests"
        value={formatCompactNumber(totalRequests)}
        description={
          <span>
            <span>{formatPercent(avgSuccessRate)}</span>
            <small> success</small>
          </span>
        }
        colorScheme="violet"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={Clock}
        title="Avg Tokens/s"
        value={formatTokensPerSecond(avgTokensPerSecond)}
        description={
          <span>
            <span>{formatDuration(avgLatency)}</span>
            <small> avg latency</small>
          </span>
        }
        colorScheme="neutral"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={Gauge}
        title="Efficiency"
        value={`$${bestCostPer1k.toFixed(6)}/1K`}
        description={
          <span>
            <small>{topEfficiencyModel || "-"}</small>
          </span>
        }
        colorScheme="cyan"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={TrendingUp}
        title="Top Spender"
        value={formatCurrency(topSpendValue)}
        description={
          <span>
            <small>{topSpendModel || "-"}</small>
          </span>
        }
        colorScheme="amber"
        variant="gradient"
        size="sm"
        loading={loading}
      />
    </div>
  );
}
