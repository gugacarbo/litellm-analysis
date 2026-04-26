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
} from "../../pages/model-stats/model-stats-utils";
import { Button } from "../button";
import { Card, CardContent } from "../card";
import { FeatureGate } from "../feature-gate";
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
                    const percentOfTotal =
                      totalSpend > 0
                        ? (Number(m.total_spend) / totalSpend) * 100
                        : 0;
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
                                  <span className="font-medium font-mono text-xs whitespace-nowrap">
                                    {modelLabel}
                                  </span>
                                );
                                break;
                              case "requests":
                                value = formatNumber(m.request_count);
                                break;
                              case "spend":
                                value = formatCurrency(m.total_spend);
                                break;
                              case "percent":
                                value = `${percentOfTotal.toFixed(1)}%`;
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
                                  <span
                                    className={
                                      Number(m.success_rate) > 95
                                        ? "text-green-600"
                                        : Number(m.success_rate) > 90
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                    }
                                  >
                                    {formatPercent(m.success_rate)}
                                  </span>
                                );
                                break;
                              case "errors":
                                value = (
                                  <span
                                    className={
                                      Number(m.error_count) > 0
                                        ? "text-red-600"
                                        : ""
                                    }
                                  >
                                    {formatNumber(m.error_count)}
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
                                  <FeatureGate
                                    capability="deleteModelLogs"
                                    fallback={
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled
                                        title="Feature not available in limited mode"
                                      >
                                        —
                                      </Button>
                                    }
                                  >
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deleting === modelName}
                                      onClick={() => onDeleteClick(modelName)}
                                    >
                                      {deleting === modelName ? "..." : "×"}
                                    </Button>
                                  </FeatureGate>
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
