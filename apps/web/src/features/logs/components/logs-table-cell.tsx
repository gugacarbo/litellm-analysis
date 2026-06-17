import { Badge } from "@/shared/components/ui/badge";
import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import {
  calculateProxyLogTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatTimeRelative,
  getProxyLogDurationMs,
  getProxyLogInputTokens,
  getProxyLogOutputTokens,
  getProxyLogTotalCost,
  isProxyLogSuccess,
} from "@/shared/lib/spend-log-utils";
import { LogEstimatedBadges } from "./log-estimated-badges";
import type { TableColumn } from "./logs-table-columns";

type RenderLogCellParams = {
  log: ProxyRequestLog;
  columnKey: TableColumn["key"];
};

export function renderLogCell({ log, columnKey }: RenderLogCellParams) {
  const durationMs = getProxyLogDurationMs(log);
  const isSuccess = isProxyLogSuccess(log.status);

  switch (columnKey) {
    case "time":
      return (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          <span>{formatTimeRelative(log.started_at)}</span>
        </span>
      );
    case "model":
      return (
        <span className="font-mono text-xs font-medium break-all">
          {log.model}
        </span>
      );
    case "inputTokens":
      return (
        <span className="inline-flex items-center justify-end gap-1">
          {formatNumber(getProxyLogInputTokens(log))}
          <LogEstimatedBadges usageEstimated={log.usage_estimated} />
        </span>
      );
    case "outputTokens":
      return formatNumber(getProxyLogOutputTokens(log));
    case "totalTokens":
      return (
        <span className="font-medium">
          {formatNumber(log.total_tokens ?? 0)}
        </span>
      );
    case "duration":
      return formatDuration(durationMs);
    case "timeToFirstToken":
      return log.ttft_ms === null ? "-" : formatNumber(Math.round(log.ttft_ms));
    case "tokensPerSecond":
      return calculateProxyLogTokensPerSecond(log);
    case "totalCost":
      return (
        <span className="inline-flex items-center justify-end gap-1 font-medium">
          {formatCurrency(getProxyLogTotalCost(log))}
          <LogEstimatedBadges costEstimated={log.cost_estimated} />
        </span>
      );
    case "status":
      return (
        <Badge
          variant={isSuccess ? "secondary" : "destructive"}
          className={
            isSuccess
              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
              : ""
          }
        >
          {log.status}
        </Badge>
      );
    case "requestId":
      return (
        <span className="font-mono text-xs text-muted-foreground break-all">
          {log.id}
        </span>
      );
    case "latencyHeat": {
      const durationSec = durationMs / 1000;

      let barColor = "bg-emerald-500";
      if (durationSec >= 5) {
        barColor = "bg-red-500";
      } else if (durationSec >= 1) {
        barColor = "bg-amber-500";
      }

      const maxWidth = 100;
      const barWidth = Math.min(maxWidth, (durationSec / 10) * maxWidth);

      return (
        <div className="flex items-center gap-2 justify-end">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
            {formatDuration(durationMs)}
          </span>
        </div>
      );
    }
  }
}
