import type { SpendLog } from "@lite-llm/contracts/analytics";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatTimeRelative,
} from "@/shared/lib/spend-log-utils";
import { Badge } from "../ui/badge";
import type { TableColumn } from "./logs-table-columns";

type RenderLogCellParams = {
  log: SpendLog;
  columnKey: TableColumn["key"];
};

export function renderLogCell({ log, columnKey }: RenderLogCellParams) {
  const durationMs =
    new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
  const isSuccess = log.status === "200" || log.status === "success";

  switch (columnKey) {
    case "time":
      return (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          <span>{formatTimeRelative(log.start_time)}</span>
        </span>
      );
    case "model":
      return (
        <span className="font-mono text-xs font-medium break-all">
          {log.model}
        </span>
      );
    case "user":
      return (
        <span className="text-sm text-muted-foreground">{log.user || "-"}</span>
      );
    case "promptTokens":
      return formatNumber(log.prompt_tokens);
    case "completionTokens":
      return formatNumber(log.completion_tokens);
    case "totalTokens":
      return (
        <span className="font-medium">{formatNumber(log.total_tokens)}</span>
      );
    case "duration":
      return formatDuration(durationMs);
    case "timeToFirstToken":
      return log.time_to_first_token_ms === null
        ? "-"
        : formatNumber(Math.round(log.time_to_first_token_ms));
    case "tokensPerSecond":
      return calculateTokensPerSecond(
        log.completion_tokens,
        log.start_time,
        log.end_time,
      );
    case "spend":
      return <span className="font-medium">{formatCurrency(log.spend)}</span>;
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
          {log.request_id}
        </span>
      );
    case "latencyHeat": {
      const startTime = new Date(log.start_time).getTime();
      const endTime = log.end_time
        ? new Date(log.end_time).getTime()
        : startTime;
      const durationMs = endTime - startTime;
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
