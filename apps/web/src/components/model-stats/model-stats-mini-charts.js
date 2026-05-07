import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { APP_LOCALE } from "@/lib/locale";
import { formatCurrency, formatDuration } from "../../lib/spend-log-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

function BarRow({ label, value, formatted, max, color, href }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return _jsxs("div", {
    className: "space-y-1",
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between text-xs",
        children: [
          href
            ? _jsx(Link, {
                to: href,
                className:
                  "font-mono text-xs hover:underline truncate max-w-[60%]",
                children: label || "(no model)",
              })
            : _jsx("span", {
                className: "font-mono text-xs truncate max-w-[60%]",
                children: label || "(no model)",
              }),
          _jsx("span", {
            className: "text-muted-foreground tabular-nums",
            children: formatted,
          }),
        ],
      }),
      _jsx("div", {
        className: "h-2 bg-muted rounded-full overflow-hidden",
        children: _jsx("div", {
          className: `h-full rounded-full transition-all ${color}`,
          style: { width: `${pct}%` },
        }),
      }),
    ],
  });
}
export function ModelStatsMiniCharts({ data, loading }) {
  const topBySpend = [...data]
    .sort((a, b) => Number(b.total_spend) - Number(a.total_spend))
    .slice(0, 5);
  const maxSpend = topBySpend[0] ? Number(topBySpend[0].total_spend) : 0;
  const topByTokens = [...data]
    .sort((a, b) => Number(b.total_tokens) - Number(a.total_tokens))
    .slice(0, 5);
  const maxTokens = topByTokens[0] ? Number(topByTokens[0].total_tokens) : 0;
  const slowestModels = [...data]
    .filter((m) => Number(m.avg_latency_ms) > 0)
    .sort((a, b) => Number(b.avg_latency_ms) - Number(a.avg_latency_ms))
    .slice(0, 5);
  const maxLatency =
    slowestModels[0] && Number(slowestModels[0].avg_latency_ms) > 0
      ? Number(slowestModels[0].avg_latency_ms)
      : 0;
  const totalRequests = data.reduce(
    (sum, m) => sum + Number(m.request_count),
    0,
  );
  const totalErrors = data.reduce(
    (sum, m) => sum + Number(m.error_count || 0),
    0,
  );
  const successRequests = totalRequests - totalErrors;
  const successPct =
    totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;
  const errorPct = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  if (!loading && data.length === 0) return null;
  return _jsxs("div", {
    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, {
              className: "text-sm font-medium",
              children: "Top Spend (by Model)",
            }),
          }),
          _jsx(CardContent, {
            className: "space-y-3",
            children: loading
              ? Array.from({ length: 5 }).map((_, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "space-y-1",
                      children: [
                        _jsx(Skeleton, { className: "h-4 w-full" }),
                        _jsx(Skeleton, { className: "h-2 w-3/4" }),
                      ],
                    },
                    i,
                  ),
                )
              : topBySpend.map((m) =>
                  _jsx(
                    BarRow,
                    {
                      label: m.model,
                      value: Number(m.total_spend),
                      formatted: formatCurrency(m.total_spend),
                      max: maxSpend,
                      color: "bg-blue-500",
                      href: `/model-stats/${encodeURIComponent(m.model)}`,
                    },
                    m.model,
                  ),
                ),
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, {
              className: "text-sm font-medium",
              children: "Token Ratio (Top 5)",
            }),
          }),
          _jsx(CardContent, {
            className: "space-y-3",
            children: loading
              ? Array.from({ length: 5 }).map((_, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "space-y-1",
                      children: [
                        _jsx(Skeleton, { className: "h-4 w-full" }),
                        _jsx(Skeleton, { className: "h-2 w-3/4" }),
                      ],
                    },
                    i,
                  ),
                )
              : topByTokens.map((m) => {
                  return _jsxs(
                    "div",
                    {
                      className: "space-y-1",
                      children: [
                        _jsxs("div", {
                          className:
                            "flex items-center justify-between text-xs",
                          children: [
                            _jsx("span", {
                              className:
                                "font-mono text-xs truncate max-w-[60%]",
                              children: m.model || "(no model)",
                            }),
                            _jsxs("span", {
                              className:
                                "text-muted-foreground tabular-nums text-xs",
                              children: [
                                Number(m.total_tokens).toLocaleString(
                                  APP_LOCALE,
                                ),
                                " ",
                                "tokens",
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className:
                            "h-2 bg-muted rounded-full overflow-hidden flex",
                          children: [
                            _jsx("div", {
                              className: "h-full bg-blue-500 transition-all",
                              style: {
                                width: `${
                                  maxTokens > 0
                                    ? (Number(m.prompt_tokens) / maxTokens) *
                                      100
                                    : 0
                                }%`,
                              },
                            }),
                            _jsx("div", {
                              className: "h-full bg-orange-400 transition-all",
                              style: {
                                width: `${
                                  maxTokens > 0
                                    ? (
                                        Number(m.completion_tokens) / maxTokens
                                      ) * 100
                                    : 0
                                }%`,
                              },
                            }),
                          ],
                        }),
                      ],
                    },
                    m.model,
                  );
                }),
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, {
              className: "text-sm font-medium",
              children: "Slowest Models (avg)",
            }),
          }),
          _jsx(CardContent, {
            className: "space-y-3",
            children: loading
              ? Array.from({ length: 5 }).map((_, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "space-y-1",
                      children: [
                        _jsx(Skeleton, { className: "h-4 w-full" }),
                        _jsx(Skeleton, { className: "h-2 w-3/4" }),
                      ],
                    },
                    i,
                  ),
                )
              : slowestModels.map((m) => {
                  const latency = Number(m.avg_latency_ms);
                  return _jsx(
                    BarRow,
                    {
                      label: m.model,
                      value: latency,
                      formatted: formatDuration(latency),
                      max: maxLatency,
                      color:
                        latency >= 5000
                          ? "bg-red-500"
                          : latency >= 1000
                            ? "bg-yellow-500"
                            : "bg-emerald-500",
                      href: `/model-stats/${encodeURIComponent(m.model)}`,
                    },
                    m.model,
                  );
                }),
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, {
              className: "text-sm font-medium",
              children: "Status Breakdown",
            }),
          }),
          _jsx(CardContent, {
            children: loading
              ? _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Skeleton, { className: "h-4 w-full" }),
                    _jsx(Skeleton, { className: "h-4 w-3/4" }),
                  ],
                })
              : _jsxs("div", {
                  className: "flex flex-col justify-center h-full gap-3",
                  children: [
                    _jsxs("div", {
                      className:
                        "w-full h-4 rounded-full bg-muted overflow-hidden flex",
                      children: [
                        _jsx("div", {
                          className: "h-full bg-emerald-500 transition-all",
                          style: { width: `${successPct}%` },
                        }),
                        _jsx("div", {
                          className: "h-full bg-red-500 transition-all",
                          style: { width: `${errorPct}%` },
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className:
                        "flex justify-between text-xs text-muted-foreground",
                      children: [
                        _jsxs("span", {
                          className: "text-emerald-600 dark:text-emerald-400",
                          children: [
                            "\u2713 ",
                            successRequests.toLocaleString(APP_LOCALE),
                            " success (",
                            successPct.toFixed(1),
                            "%)",
                          ],
                        }),
                        _jsxs("span", {
                          className: "text-red-600 dark:text-red-400",
                          children: [
                            "\u2717 ",
                            totalErrors.toLocaleString(APP_LOCALE),
                            " errors (",
                            errorPct.toFixed(1),
                            "%)",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
          }),
        ],
      }),
    ],
  });
}
