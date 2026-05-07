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
import { CHART_HEIGHT } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import { formatNumber } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";
export function ErrorBreakdownChart({ loading, sortedData, rangeLabel }) {
  const data = sortedData
    .filter((m) => m.error_count > 0)
    .sort((a, b) => b.error_count - a.error_count)
    .slice(0, TOP_N_MODELS)
    .map((m) => ({
      model: m.model,
      errors: m.error_count,
      success_rate: Number(m.success_rate),
    }));
  return _jsx(ChartCard, {
    title: `Error Breakdown (${rangeLabel})`,
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
          _jsx(XAxis, { type: "number" }),
          _jsx(YAxis, {
            dataKey: "model",
            type: "category",
            width: 150,
            tick: { fontSize: 11 },
          }),
          _jsx(Tooltip, {
            content: _jsx(ChartTooltipContent, {}),
            formatter: (v) => formatNumber(Number(v)),
          }),
          _jsx(Bar, {
            dataKey: "errors",
            name: "Error Count",
            fill: "#ef4444",
            maxBarSize: 30,
            children: data.map((entry, index) =>
              _jsx(
                Cell,
                {
                  fill:
                    entry.success_rate < 90
                      ? "#ef4444"
                      : entry.success_rate < 95
                        ? "#f59e0b"
                        : "#10b981",
                },
                `cell-${index}`,
              ),
            ),
          }),
        ],
      }),
    }),
  });
}
