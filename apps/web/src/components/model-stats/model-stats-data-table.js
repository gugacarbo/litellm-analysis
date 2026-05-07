import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
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
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

function SpendBar({ value, total }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return _jsxs("div", {
    className: "flex items-center gap-2",
    children: [
      _jsx("div", {
        className:
          "flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]",
        children: _jsx("div", {
          className: "h-full bg-primary rounded-full transition-all",
          style: { width: `${pct}%` },
        }),
      }),
      _jsxs("span", {
        className: "text-xs text-muted-foreground tabular-nums w-8 text-right",
        children: [pct.toFixed(1), "%"],
      }),
    ],
  });
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
}) {
  return _jsx(Card, {
    children: _jsx(CardContent, {
      children: _jsx("div", {
        className: "overflow-x-auto",
        children: _jsxs(Table, {
          children: [
            _jsx(TableHeader, {
              children: _jsx(TableRow, {
                children: columns
                  .filter((c) => visibleColumns.includes(c.key))
                  .map((col) =>
                    _jsxs(
                      TableHead,
                      {
                        className:
                          col.align === "right"
                            ? "cursor-pointer hover:text-primary text-right"
                            : "cursor-pointer hover:text-primary",
                        onClick: () => col.sortable && onSort(col.sortable),
                        children: [
                          col.label,
                          " ",
                          col.sortable &&
                            sortField === col.sortable &&
                            (sortDirection === "asc" ? "↑" : "↓"),
                        ],
                      },
                      col.key,
                    ),
                  ),
              }),
            }),
            _jsx(TableBody, {
              children: loading
                ? Array.from({ length: 10 }).map((_, i) =>
                    _jsx(
                      TableRow,
                      {
                        children: columns
                          .filter((c) => visibleColumns.includes(c.key))
                          .map((col) =>
                            _jsx(
                              TableCell,
                              {
                                className:
                                  col.align === "right" ? "text-right" : "",
                                children: _jsx(Skeleton, {
                                  className: "h-4 w-12 ml-auto",
                                }),
                              },
                              col.key,
                            ),
                          ),
                      },
                      i,
                    ),
                  )
                : data.map((m, i) => {
                    const modelName =
                      typeof m.model === "string" ? m.model : "";
                    const modelLabel = modelName.trim()
                      ? modelName
                      : "(no model)";
                    return _jsx(
                      TableRow,
                      {
                        children: columns
                          .filter((c) => visibleColumns.includes(c.key))
                          .map((col) => {
                            let value = null;
                            switch (col.key) {
                              case "model":
                                value = _jsxs("div", {
                                  className: "flex items-center gap-2",
                                  children: [
                                    _jsx("div", {
                                      className: `h-2 w-2 rounded-full shrink-0 ${getHealthColor(m.success_rate)}`,
                                    }),
                                    _jsx(Link, {
                                      to: `/model-stats/${encodeURIComponent(modelName)}`,
                                      className:
                                        "font-medium font-mono text-xs whitespace-nowrap hover:underline",
                                      children: modelLabel,
                                    }),
                                  ],
                                });
                                break;
                              case "requests":
                                value = formatNumber(m.request_count);
                                break;
                              case "spend":
                                value = formatCurrency(m.total_spend);
                                break;
                              case "percent":
                                value = _jsx(SpendBar, {
                                  value: Number(m.total_spend),
                                  total: totalSpend,
                                });
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
                                value = _jsx(Badge, {
                                  variant:
                                    Number(m.success_rate) > 95
                                      ? "default"
                                      : Number(m.success_rate) > 90
                                        ? "secondary"
                                        : "destructive",
                                  children: formatPercent(m.success_rate),
                                });
                                break;
                              case "errors":
                                value =
                                  Number(m.error_count) > 0
                                    ? _jsx("span", {
                                        className:
                                          "text-red-600 dark:text-red-400 font-medium",
                                        children: formatNumber(m.error_count),
                                      })
                                    : _jsx("span", {
                                        className: "text-muted-foreground",
                                        children: "0",
                                      });
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
                                value = _jsx("button", {
                                  type: "button",
                                  className:
                                    "inline-flex items-center justify-center h-6 w-6 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                                  disabled: deleting === modelName,
                                  onClick: () => onDeleteClick(modelName),
                                  "aria-label": `Delete ${modelLabel}`,
                                  children: deleting === modelName ? "⋯" : "✕",
                                });
                                break;
                            }
                            return _jsx(
                              TableCell,
                              {
                                className:
                                  col.align === "right" ? "text-right" : "",
                                children: value,
                              },
                              col.key,
                            );
                          }),
                      },
                      `${modelName}-${i}`,
                    );
                  }),
            }),
          ],
        }),
      }),
    }),
  });
}
