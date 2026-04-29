import {
  Activity,
  CheckCircle,
  Clock,
  DollarSign,
  Gauge,
  Sparkles,
} from "lucide-react";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
} from "../../pages/model-stats/model-stats-utils";
import { MetricCard } from "../metric-card";

type ModelStatsSummaryCardsProps = {
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  avgSuccessRate: number;
  totalErrors: number;
  avgLatency: number;
  avgCostPerRequest: number;
  uniqueModels: number;
  maxTokensPerSecond: number;
  rangeLabel: string;
};

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
}: ModelStatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
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
            <span>{formatCompactNumber(totalRequests)}</span>
            <small> requests</small>
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
        icon={CheckCircle}
        title="Success Rate"
        value={formatPercent(avgSuccessRate)}
        description={
          <span>
            <span>{formatCompactNumber(totalErrors)}</span>
            <small> errors</small>
          </span>
        }
        colorScheme="green"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={Clock}
        title="Avg Latency"
        value={formatDuration(avgLatency)}
        description={
          <span>
            <span>{formatCompactNumber(maxTokensPerSecond)}</span>
            <small> max tok/s</small>
          </span>
        }
        colorScheme="neutral"
        variant="gradient"
        size="sm"
        loading={loading}
      />
      <MetricCard
        icon={Activity}
        title="Models"
        value={formatCompactNumber(uniqueModels)}
        description={rangeLabel}
        colorScheme="cyan"
        variant="gradient"
        size="sm"
        loading={loading}
      />
    </div>
  );
}
