import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_HEIGHT, LATENCY_COLORS } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import { formatDuration } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";
export function LatencyChart({ loading, sortedData, rangeLabel }) {
  const data = sortedData
    .filter((m) => m.p50_latency_ms > 0)
    .slice(0, TOP_N_MODELS)
    .map((m) => ({
      model: m.model,
      p50: m.p50_latency_ms,
      p95: m.p95_latency_ms,
      p99: m.p99_latency_ms,
    }));
  return _jsx(ChartCard, {
    title: `Latency Percentiles (${rangeLabel})`,
    loading: loading,
    hasData: data.length > 0,
    children: _jsx(ResponsiveContainer, {
      width: "100%",
      height: CHART_HEIGHT,
      children: _jsxs(BarChart, {
        data: data,
        layout: "vertical",
        children: [
          _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          _jsx(XAxis, {
            type: "number",
            tickFormatter: (v) => formatDuration(Number(v)),
          }),
          _jsx(YAxis, {
            dataKey: "model",
            type: "category",
            width: 150,
            tick: { fontSize: 11 },
          }),
          _jsx(Tooltip, {
            content: _jsx(ChartTooltipContent, {}),
            formatter: (v) => formatDuration(Number(v)),
          }),
          _jsx(Legend, {}),
          _jsx(Bar, {
            dataKey: "p50",
            name: "P50",
            fill: LATENCY_COLORS.p50,
            maxBarSize: 20,
          }),
          _jsx(Bar, {
            dataKey: "p95",
            name: "P95",
            fill: LATENCY_COLORS.p95,
            maxBarSize: 20,
          }),
          _jsx(Bar, {
            dataKey: "p99",
            name: "P99",
            fill: LATENCY_COLORS.p99,
            maxBarSize: 20,
          }),
        ],
      }),
    }),
  });
}
