import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_HEIGHT,
  formatDuration,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailLatencyChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Latency Trend ", rangeLabel && `(${rangeLabel})`],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : data.length > 0
            ? _jsx(ResponsiveContainer, {
                width: "100%",
                height: CHART_HEIGHT,
                children: _jsxs(LineChart, {
                  data: data,
                  children: [
                    _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                    _jsx(XAxis, { dataKey: "date" }),
                    _jsx(YAxis, {
                      tickFormatter: (v) => formatDuration(Number(v)),
                    }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v) => formatDuration(Number(v)),
                    }),
                    _jsx(Legend, {}),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "avgLatencyMs",
                      name: "Avg",
                      stroke: "#3b82f6",
                      strokeWidth: 2,
                      dot: false,
                    }),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "p50LatencyMs",
                      name: "P50",
                      stroke: "#10b981",
                      strokeWidth: 2,
                      dot: false,
                    }),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "p95LatencyMs",
                      name: "P95",
                      stroke: "#f59e0b",
                      strokeWidth: 2,
                      dot: false,
                    }),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "p99LatencyMs",
                      name: "P99",
                      stroke: "#ef4444",
                      strokeWidth: 2,
                      dot: false,
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No latency data available",
              }),
      }),
    ],
  });
}
