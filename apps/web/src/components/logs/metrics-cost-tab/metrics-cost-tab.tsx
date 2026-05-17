import type { SpendLog } from "@lite-llm/api-contracts/analytics";
import { DollarSign, Timer, TrendingUp, Zap } from "lucide-react";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
} from "@/lib/spend-log-utils";
import { MiniMetricCard } from "../log-detail-metric-card";
import { MetricsSummaryTable } from "./metrics-summary-table";
import { TokenDistributionChart } from "./token-distribution-chart";

interface MetricsCostTabProps {
  log: SpendLog;
}

export function MetricsCostTab({ log }: MetricsCostTabProps) {
  const durationMs =
    new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
  const tokensPerSec = calculateTokensPerSecond(
    log.completion_tokens,
    log.start_time,
    log.end_time,
  );

  return (
    <div className="space-y-4">
      {/* Metric Cards Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniMetricCard
          icon={DollarSign}
          label="Total Spend"
          value={formatCurrency(log.spend)}
          accent="text-emerald-500"
        />
        <MiniMetricCard
          icon={Timer}
          label="Duration"
          value={formatDuration(durationMs)}
          accent="text-blue-500"
        />
        <MiniMetricCard
          icon={Zap}
          label="Total Tokens"
          value={log.total_tokens.toLocaleString()}
          accent="text-amber-500"
        />
        <MiniMetricCard
          icon={TrendingUp}
          label="Speed"
          value={tokensPerSec}
          accent="text-purple-500"
        />
        <MiniMetricCard
          icon={Zap}
          label="Time to First Token"
          value={
            log.time_to_first_token_ms != null
              ? `${Math.round(log.time_to_first_token_ms)}ms`
              : "-"
          }
          accent={
            log.time_to_first_token_ms != null
              ? log.time_to_first_token_ms < 500
                ? "text-emerald-500"
                : log.time_to_first_token_ms < 2000
                  ? "text-amber-500"
                  : "text-red-500"
              : "text-muted-foreground"
          }
        />
      </div>

      {/* Token Distribution Chart and Summary Table */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TokenDistributionChart log={log} />
        <MetricsSummaryTable log={log} durationMs={durationMs} />
      </div>
    </div>
  );
}
