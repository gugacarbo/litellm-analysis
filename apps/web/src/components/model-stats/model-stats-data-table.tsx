import {
  AlertTriangle,
  ArrowUpRight,
  ScrollText,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  Column,
  ColumnKey,
  ModelStats,
  SortDirection,
  SortField,
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
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type ModelStatsDataTableProps = {
  loading: boolean;
  data: ModelStats[];
  totalModelsCount: number;
  columns: Column[];
  visibleColumns: ColumnKey[];
  sortField: SortField;
  sortDirection: SortDirection;
  totalSpend: number;
  deleting: string | null;
  onSort: (field: SortField) => void;
  onDeleteClick: (modelName: string) => void;
};

function SpendBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[48px]">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function getHealthStatus(model: ModelStats): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const successRate = Number(model.success_rate || 0);
  const errorCount = Number(model.error_count || 0);
  const avgLatency = Number(model.avg_latency_ms || 0);

  if (successRate >= 99 && errorCount === 0 && avgLatency < 1000) {
    return { label: "Excellent", variant: "default" };
  }

  if (successRate >= 97 && avgLatency < 2000) {
    return { label: "Healthy", variant: "secondary" };
  }

  if (successRate >= 92) {
    return { label: "Watch", variant: "outline" };
  }

  return { label: "Unstable", variant: "destructive" };
}

function getSortLabel(
  sortField: SortField,
  sortDirection: SortDirection,
): string {
  const direction = sortDirection === "asc" ? "ascending" : "descending";

  switch (sortField) {
    case "model":
      return `Sorted by model (${direction})`;
    case "request_count":
      return `Sorted by requests (${direction})`;
    case "total_spend":
      return `Sorted by spend (${direction})`;
    case "total_tokens":
      return `Sorted by tokens (${direction})`;
    case "avg_latency_ms":
      return `Sorted by latency (${direction})`;
    case "success_rate":
      return `Sorted by success (${direction})`;
    case "error_count":
      return `Sorted by errors (${direction})`;
    case "avg_tokens_per_request":
      return `Sorted by avg tokens/request (${direction})`;
    default:
      return "Sorted";
  }
}

export function ModelStatsDataTable({
  loading,
  data,
  totalModelsCount,
  columns,
  visibleColumns,
  sortField,
  sortDirection,
  totalSpend,
  deleting,
  onSort,
  onDeleteClick,
}: ModelStatsDataTableProps) {
  const shownColumns = columns.filter((column) =>
    visibleColumns.includes(column.key),
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Model Leaderboard</CardTitle>
            <CardDescription>
              {loading
                ? "Loading model metrics..."
                : `${data.length} of ${totalModelsCount} models shown`}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {getSortLabel(sortField, sortDirection)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {shownColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={
                      column.align === "right"
                        ? "cursor-pointer hover:text-primary text-right"
                        : "cursor-pointer hover:text-primary"
                    }
                    onClick={() => column.sortable && onSort(column.sortable)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.label || "Actions"}
                      {column.sortable && sortField === column.sortable
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading
                ? Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {shownColumns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={
                            column.align === "right" ? "text-right" : ""
                          }
                        >
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data.map((model, index) => {
                    const modelName =
                      typeof model.model === "string" ? model.model : "";
                    const modelLabel = modelName.trim()
                      ? modelName
                      : "(no model)";
                    const health = getHealthStatus(model);
                    const isIncidentModel =
                      Number(model.error_count || 0) > 0 ||
                      Number(model.success_rate || 0) < 95;

                    return (
                      <TableRow key={`${modelName}-${index}`}>
                        {shownColumns.map((column) => {
                          let value: React.ReactNode = null;

                          switch (column.key) {
                            case "model":
                              value = (
                                <div className="min-w-[220px] space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${getHealthColor(model.success_rate)}`}
                                    />
                                    <Link
                                      to={`/model-stats/${encodeURIComponent(modelName)}`}
                                      className="font-semibold font-mono text-xs hover:underline"
                                    >
                                      {modelLabel}
                                    </Link>
                                    <Badge variant={health.variant}>
                                      {health.label}
                                    </Badge>
                                    {isIncidentModel ? (
                                      <Badge
                                        variant="destructive"
                                        className="gap-1"
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        Incident
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {formatNumber(model.request_count)} req ·{" "}
                                    {formatPercent(model.success_rate)} success
                                  </p>
                                </div>
                              );
                              break;
                            case "requests":
                              value = (
                                <span className="tabular-nums">
                                  {formatNumber(model.request_count)}
                                </span>
                              );
                              break;
                            case "spend":
                              value = (
                                <span className="tabular-nums font-medium">
                                  {formatCurrency(model.total_spend)}
                                </span>
                              );
                              break;
                            case "percent":
                              value = (
                                <SpendBar
                                  value={Number(model.total_spend)}
                                  total={totalSpend}
                                />
                              );
                              break;
                            case "tokens":
                              value = (
                                <span className="tabular-nums">
                                  {formatNumber(model.total_tokens)}
                                </span>
                              );
                              break;
                            case "prompt":
                              value = formatNumber(model.prompt_tokens);
                              break;
                            case "output":
                              value = formatNumber(model.completion_tokens);
                              break;
                            case "avgTok":
                              value = formatNumber(
                                model.avg_tokens_per_request,
                              );
                              break;
                            case "tokPerSec":
                              value = formatTokensPerSecond(
                                model.p50_tokens_per_second,
                              );
                              break;
                            case "costPer1k":
                              value =
                                Number(model.total_tokens) > 0
                                  ? `$${((Number(model.total_spend) / Number(model.total_tokens)) * 1000).toFixed(4)}`
                                  : "-";
                              break;
                            case "latency":
                              value = formatDuration(model.avg_latency_ms);
                              break;
                            case "p50":
                              value = formatDuration(model.p50_latency_ms);
                              break;
                            case "p95":
                              value = formatDuration(model.p95_latency_ms);
                              break;
                            case "p99":
                              value = formatDuration(model.p99_latency_ms);
                              break;
                            case "success":
                              value = (
                                <Badge
                                  variant={
                                    Number(model.success_rate) > 95
                                      ? "default"
                                      : Number(model.success_rate) > 90
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {formatPercent(model.success_rate)}
                                </Badge>
                              );
                              break;
                            case "errors":
                              value =
                                Number(model.error_count) > 0 ? (
                                  <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">
                                    {formatNumber(model.error_count)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground tabular-nums">
                                    0
                                  </span>
                                );
                              break;
                            case "errorRate":
                              value = (
                                <span className="tabular-nums">
                                  {Number(model.request_count) > 0
                                    ? formatPercent(
                                        (Number(model.error_count || 0) /
                                          Number(model.request_count)) *
                                          100,
                                      )
                                    : "0%"}
                                </span>
                              );
                              break;
                            case "users":
                              value = formatNumber(model.unique_users);
                              break;
                            case "keys":
                              value = formatNumber(model.unique_api_keys);
                              break;
                            case "first":
                              value = formatDate(model.first_seen);
                              break;
                            case "last":
                              value = formatDate(model.last_seen);
                              break;
                            case "actions":
                              value = (
                                <div className="inline-flex items-center gap-1">
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link
                                      to={`/model-stats/${encodeURIComponent(modelName)}`}
                                      aria-label={`Open details for ${modelLabel}`}
                                    >
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link
                                      to={`/model-stats/${encodeURIComponent(modelName)}?tab=logs`}
                                      aria-label={`Open logs for ${modelLabel}`}
                                    >
                                      <ScrollText className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={deleting === modelName}
                                    onClick={() => onDeleteClick(modelName)}
                                    aria-label={`Delete ${modelLabel}`}
                                  >
                                    {deleting === modelName ? (
                                      <span className="text-xs">⋯</span>
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    )}
                                  </Button>
                                </div>
                              );
                              break;
                          }

                          return (
                            <TableCell
                              key={column.key}
                              className={
                                column.align === "right"
                                  ? "text-right tabular-nums"
                                  : ""
                              }
                            >
                              {value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>

        {!loading && data.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="inline-flex items-center gap-2 font-medium">
              <WandSparkles className="h-4 w-4" />
              No models match your filters
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try changing search, date range, or use the Essential preset.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
