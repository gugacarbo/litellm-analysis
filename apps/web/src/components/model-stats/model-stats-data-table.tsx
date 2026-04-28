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
import { Badge } from "../badge";
import { Card, CardContent } from "../card";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

type ModelStatsDataTableProps = {
  loading: boolean;
  data: ModelStats[];
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

export function ModelStatsDataTable({
  loading,
  data,
  columns,
  visibleColumns,
  sortField,
  sortDirection,
  totalSpend,
  deleting,
  onSort,
  onDeleteClick,
}: ModelStatsDataTableProps) {
  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns
                  .filter((c) => visibleColumns.includes(c.key))
                  .map((col) => (
                    <TableHead
                      key={col.key}
                      className={
                        col.align === "right"
                          ? "cursor-pointer hover:text-primary text-right"
                          : "cursor-pointer hover:text-primary"
                      }
                      onClick={() => col.sortable && onSort(col.sortable)}
                    >
                      {col.label}{" "}
                      {col.sortable &&
                        sortField === col.sortable &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns
                        .filter((c) => visibleColumns.includes(c.key))
                        .map((col) => (
                          <TableCell
                            key={col.key}
                            className={
                              col.align === "right" ? "text-right" : ""
                            }
                          >
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
                : data.map((m, i) => {
                    const modelName =
                      typeof m.model === "string" ? m.model : "";
                    const modelLabel = modelName.trim()
                      ? modelName
                      : "(no model)";

                    return (
                      <TableRow key={`${modelName}-${i}`}>
                        {columns
                          .filter((c) => visibleColumns.includes(c.key))
                          .map((col) => {
                            let value: React.ReactNode = null;

                            switch (col.key) {
                              case "model":
                                value = (
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
                                break;
                              case "requests":
                                value = formatNumber(m.request_count);
                                break;
                              case "spend":
                                value = formatCurrency(m.total_spend);
                                break;
                              case "percent":
                                value = (
                                  <SpendBar
                                    value={Number(m.total_spend)}
                                    total={totalSpend}
                                  />
                                );
                                break;
                              case "tokens":
                                value = formatNumber(m.total_tokens);
                                break;
                              case "prompt":
                                value = formatNumber(m.prompt_tokens);
                                break;
                              case "output":
                                value = formatNumber(m.completion_tokens);
                                break;
                              case "avgTok":
                                value = formatNumber(m.avg_tokens_per_request);
                                break;
                              case "tokPerSec":
                                value = formatTokensPerSecond(
                                  m.p50_tokens_per_second,
                                );
                                break;
                              case "costPer1k":
                                value =
                                  Number(m.total_tokens) > 0
                                    ? `$${((Number(m.total_spend) / Number(m.total_tokens)) * 1000).toFixed(4)}`
                                    : "-";
                                break;
                              case "latency":
                                value = formatDuration(m.avg_latency_ms);
                                break;
                              case "p50":
                                value = formatDuration(m.p50_latency_ms);
                                break;
                              case "p95":
                                value = formatDuration(m.p95_latency_ms);
                                break;
                              case "p99":
                                value = formatDuration(m.p99_latency_ms);
                                break;
                              case "success":
                                value = (
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
                                break;
                              case "errors":
                                value =
                                  Number(m.error_count) > 0 ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                      {formatNumber(m.error_count)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      0
                                    </span>
                                  );
                                break;
                              case "users":
                                value = formatNumber(m.unique_users);
                                break;
                              case "keys":
                                value = formatNumber(m.unique_api_keys);
                                break;
                              case "first":
                                value = formatDate(m.first_seen);
                                break;
                              case "last":
                                value = formatDate(m.last_seen);
                                break;
                              case "actions":
                                value = (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center h-6 w-6 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    disabled={deleting === modelName}
                                    onClick={() => onDeleteClick(modelName)}
                                    aria-label={`Delete ${modelLabel}`}
                                  >
                                    {deleting === modelName ? "⋯" : "✕"}
                                  </button>
                                );
                                break;
                            }

                            return (
                              <TableCell
                                key={col.key}
                                className={
                                  col.align === "right" ? "text-right" : ""
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
      </CardContent>
    </Card>
  );
}
