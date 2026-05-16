import { Clock, DollarSign, Gauge, Sparkles } from "lucide-react";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
  formatTokensPerSecond,
} from "../../pages/model-stats/model-stats-utils";
import { MetricCard } from "../metric-card";

type ModelStatsSummaryCardsProps = {
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  avgSuccessRate: number;
  avgLatency: number;
  avgTokensPerSecond: number;
  avgCostPerRequest: number;
  avgCostPer1kTokens: number;
};

export function ModelStatsSummaryCards({
  loading,
  totalSpend,
  totalRequests,
  totalTokens,
  totalPromptTokens,
  avgSuccessRate,
  avgLatency,
  avgTokensPerSecond,
  avgCostPerRequest,
  avgCostPer1kTokens,
}: ModelStatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
            <span>{formatCompactNumber(totalPromptTokens)}</span>
            <small> input tokens</small>
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
        value={`${formatCurrency(avgCostPer1kTokens)}/1K`}
        description={
          <span>
            <small>cost per 1K tokens</small>
          </span>
        }
        colorScheme="cyan"
        variant="gradient"
        size="sm"
        loading={loading}
      />
    </div>
  );
}
