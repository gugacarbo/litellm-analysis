import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const TTFT_COLORS = ["#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444"];
export function ModelDetailTTFTChart({ data, loading }) {
  const chartData = data
    ? [
        { name: "P50", value: data.p50_ttft_ms },
        { name: "Avg", value: data.avg_ttft_ms },
        { name: "P95", value: data.p95_ttft_ms },
        { name: "P99", value: data.p99_ttft_ms },
      ]
    : [];
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsx(CardTitle, { children: "Time to First Token (TTFT)" }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : data && chartData.length > 0
            ? _jsx(ResponsiveContainer, {
                width: "100%",
                height: CHART_HEIGHT,
                children: _jsxs(BarChart, {
                  data: chartData,
                  layout: "vertical",
                  margin: { left: 40 },
                  children: [
                    _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                    _jsx(XAxis, {
                      type: "number",
                      tickFormatter: (v) => formatDuration(Number(v)),
                    }),
                    _jsx(YAxis, {
                      dataKey: "name",
                      type: "category",
                      width: 60,
                    }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v) => formatDuration(Number(v)),
                    }),
                    _jsx(Bar, {
                      dataKey: "value",
                      name: "TTFT",
                      radius: [0, 4, 4, 0],
                      maxBarSize: 40,
                      children: chartData.map((entry, index) =>
                        _jsx(Cell, { fill: TTFT_COLORS[index] }, entry.name),
                      ),
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No streaming data available",
              }),
      }),
    ],
  });
}
