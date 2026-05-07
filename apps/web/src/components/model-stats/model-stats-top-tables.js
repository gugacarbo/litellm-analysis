import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import {
  formatCompactNumber,
  formatCurrency,
} from "../../pages/model-stats/model-stats-utils";
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
          _jsx(Link, {
            to: href,
            className: "font-mono text-xs hover:underline truncate max-w-[60%]",
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
export function ModelStatsTopTables({ data, loading, rangeLabel }) {
  const topBySpend = [...data]
    .sort((a, b) => Number(b.total_spend) - Number(a.total_spend))
    .slice(0, 8);
  const topByRequests = [...data]
    .sort((a, b) => Number(b.request_count) - Number(a.request_count))
    .slice(0, 8);
  const maxSpend = topBySpend[0] ? Number(topBySpend[0].total_spend) : 0;
  const maxRequests = topByRequests[0]
    ? Number(topByRequests[0].request_count)
    : 0;
  return _jsxs("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: ["Top Models by Spend (", rangeLabel, ")"],
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
            children: _jsxs(CardTitle, {
              children: ["Top Models by Requests (", rangeLabel, ")"],
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
              : topByRequests.map((m) =>
                  _jsx(
                    BarRow,
                    {
                      label: m.model,
                      value: Number(m.request_count),
                      formatted: `${formatCompactNumber(m.request_count)} reqs`,
                      max: maxRequests,
                      color: "bg-emerald-500",
                      href: `/model-stats/${encodeURIComponent(m.model)}`,
                    },
                    m.model,
                  ),
                ),
          }),
        ],
      }),
    ],
  });
}
