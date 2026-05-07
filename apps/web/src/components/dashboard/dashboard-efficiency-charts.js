import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatDate,
  formatNumber,
} from "../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function DashboardEfficiencyCharts({
  loading,
  rangeLabel,
  costEfficiency,
  dailyTokenTrend,
}) {
  return _jsxs("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: [
                "Cost Efficiency by Model ($/1K tokens, ",
                rangeLabel,
                ")",
              ],
            }),
          }),
          _jsx(CardContent, {
            children: loading
              ? _jsx(Skeleton, { className: "h-64 w-full" })
              : _jsx(ResponsiveContainer, {
                  width: "100%",
                  height: 300,
                  children: _jsxs(BarChart, {
                    data: costEfficiency.slice(0, 10),
                    layout: "vertical",
                    children: [
                      _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                      _jsx(XAxis, {
                        type: "number",
                        tickFormatter: (v) => `$${v.toFixed(2)}`,
                      }),
                      _jsx(YAxis, {
                        dataKey: "model",
                        type: "category",
                        width: 120,
                        tick: { fontSize: 11 },
                      }),
                      _jsx(Tooltip, {
                        content: _jsx(ChartTooltipContent, {}),
                        formatter: (v) => `$${Number(v).toFixed(4)}`,
                      }),
                      _jsx(Bar, {
                        dataKey: "cost_per_1k_tokens",
                        fill: "#f59e0b",
                      }),
                    ],
                  }),
                }),
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: ["Token Trend (", rangeLabel, ")"],
            }),
          }),
          _jsx(CardContent, {
            children: loading
              ? _jsx(Skeleton, { className: "h-64 w-full" })
              : _jsx(ResponsiveContainer, {
                  width: "100%",
                  height: 300,
                  children: _jsxs(AreaChart, {
                    data: dailyTokenTrend,
                    children: [
                      _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                      _jsx(XAxis, {
                        dataKey: "date",
                        tickFormatter: formatDate,
                      }),
                      _jsx(YAxis, { tickFormatter: formatNumber }),
                      _jsx(Tooltip, {
                        content: _jsx(ChartTooltipContent, {}),
                        formatter: (v) => formatNumber(Number(v)),
                      }),
                      _jsx(Legend, {}),
                      _jsx(Area, {
                        type: "monotone",
                        dataKey: "prompt_tokens",
                        name: "Input",
                        stackId: "1",
                        stroke: "#3b82f6",
                        fill: "#3b82f6",
                      }),
                      _jsx(Area, {
                        type: "monotone",
                        dataKey: "completion_tokens",
                        name: "Output",
                        stackId: "1",
                        stroke: "#10b981",
                        fill: "#10b981",
                      }),
                      _jsx(Line, {
                        type: "monotone",
                        dataKey: "total_tokens",
                        name: "Total",
                        stroke: "#f59e0b",
                        strokeWidth: 2,
                        dot: false,
                      }),
                    ],
                  }),
                }),
          }),
        ],
      }),
    ],
  });
}
