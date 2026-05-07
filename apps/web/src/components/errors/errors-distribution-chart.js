import { useMemo } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ERROR_COLOR } from "../../lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ErrorsDistributionChart({ errors, loading }) {
  const data = useMemo(() => {
    const counts = new Map();
    for (const error of errors) {
      const type = error.error_type || "Unknown";
      counts.set(type, (counts.get(type) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [errors]);
  if (errors.length === 0) return null;
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        className: "pb-2",
        children: _jsx(CardTitle, {
          className: "text-sm font-medium",
          children: "Error Type Distribution",
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-48 w-full" })
          : _jsx(ResponsiveContainer, {
              width: "100%",
              height: 200,
              children: _jsxs(BarChart, {
                data: data,
                layout: "vertical",
                margin: { left: 0, right: 20, top: 5, bottom: 5 },
                children: [
                  _jsx(CartesianGrid, {
                    strokeDasharray: "3 3",
                    horizontal: false,
                  }),
                  _jsx(XAxis, { type: "number", tick: { fontSize: 11 } }),
                  _jsx(YAxis, {
                    dataKey: "type",
                    type: "category",
                    width: 140,
                    tick: { fontSize: 11 },
                    tickFormatter: (value) =>
                      value.length > 25 ? `${value.slice(0, 25)}...` : value,
                  }),
                  _jsx(Tooltip, { content: _jsx(ChartTooltipContent, {}) }),
                  _jsx(Bar, {
                    dataKey: "count",
                    fill: ERROR_COLOR,
                    maxBarSize: 24,
                    radius: [0, 4, 4, 0],
                  }),
                ],
              }),
            }),
      }),
    ],
  });
}
