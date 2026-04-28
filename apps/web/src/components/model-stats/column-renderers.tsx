import type { JSX } from "react";
import { Link } from "react-router-dom";
import type {
  ColumnKey,
  ModelStats,
} from "../../pages/model-stats/model-stats-types";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  formatTokensPerSecond,
  getHealthColor,
} from "../../pages/model-stats/model-stats-utils";
import { Badge } from "../badge";

function SpendBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export interface RenderModelStatCellContext {
  totalSpend: number;
  deleting: string | null;
  onDeleteClick: (modelName: string) => void;
}

export function renderModelStatCell(
  m: ModelStats,
  columnKey: ColumnKey,
  ctx: RenderModelStatCellContext,
): JSX.Element | null {
  const modelName = typeof m.model === "string" ? m.model : "";
  const modelLabel = modelName.trim() ? modelName : "(no model)";

  switch (columnKey) {
    case "model":
      return (
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full shrink-0 ${getHealthColor(m.success_rate)}`}
          />
          <Link
            to={`/model/${encodeURIComponent(modelName)}`}
            className="font-medium font-mono text-xs whitespace-nowrap hover:underline"
          >
            {modelLabel}
          </Link>
        </div>
      );
    case "requests":
      return <>{formatNumber(m.request_count)}</>;
    case "spend":
      return <>{formatCurrency(m.total_spend)}</>;
    case "percent":
      return <SpendBar value={Number(m.total_spend)} total={ctx.totalSpend} />;
    case "tokens":
      return <>{formatNumber(m.total_tokens)}</>;
    case "prompt":
      return <>{formatNumber(m.prompt_tokens)}</>;
    case "output":
      return <>{formatNumber(m.completion_tokens)}</>;
    case "avgTok":
      return <>{formatNumber(m.avg_tokens_per_request)}</>;
    case "tokPerSec":
      return <>{formatTokensPerSecond(m.p50_tokens_per_second)}</>;
    case "costPer1k":
      return (
        <>
          {Number(m.total_tokens) > 0
            ? `$${((Number(m.total_spend) / Number(m.total_tokens)) * 1000).toFixed(4)}`
            : "-"}
        </>
      );
    case "latency":
      return <>{formatDuration(m.avg_latency_ms)}</>;
    case "p50":
      return <>{formatDuration(m.p50_latency_ms)}</>;
    case "p95":
      return <>{formatDuration(m.p95_latency_ms)}</>;
    case "p99":
      return <>{formatDuration(m.p99_latency_ms)}</>;
    case "success":
      return (
        <Badge
          variant={
            Number(m.success_rate) > 95
              ? "default"
              : Number(m.success_rate) > 90
                ? "secondary"
                : "destructive"
          }
        >
          {formatPercent(m.success_rate)}
        </Badge>
      );
    case "errors":
      return Number(m.error_count) > 0 ? (
        <span className="text-red-600 dark:text-red-400 font-medium">
          {formatNumber(m.error_count)}
        </span>
      ) : (
        <span className="text-muted-foreground">0</span>
      );
    case "users":
      return <>{formatNumber(m.unique_users)}</>;
    case "keys":
      return <>{formatNumber(m.unique_api_keys)}</>;
    case "first":
      return <>{formatDate(m.first_seen)}</>;
    case "last":
      return <>{formatDate(m.last_seen)}</>;
    case "actions":
      return (
        <button
          type="button"
          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          disabled={ctx.deleting === modelName}
          onClick={() => ctx.onDeleteClick(modelName)}
          aria-label={`Delete ${modelLabel}`}
        >
          {ctx.deleting === modelName ? "⋯" : "✕"}
        </button>
      );
    case "errorRate":
      return null;
  }
}
