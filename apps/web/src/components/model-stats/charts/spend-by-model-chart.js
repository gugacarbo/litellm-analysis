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
import { CHART_COLORS, CHART_HEIGHT } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import { formatCurrency } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";
export function SpendByModelChart({ loading, costEfficiency, rangeLabel }) {
  return _jsx(ChartCard, {
    title: `Spend by Model (${rangeLabel})`,
    loading: loading,
    hasData: costEfficiency.length > 0,
    children: _jsx(ResponsiveContainer, {
      width: "100%",
      height: CHART_HEIGHT,
      children: _jsxs(BarChart, {
        data: costEfficiency.slice(0, TOP_N_MODELS),
        layout: "vertical",
        children: [
          _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          _jsx(XAxis, {
            type: "number",
            tickFormatter: (v) => formatCurrency(Number(v)),
          }),
          _jsx(YAxis, {
            dataKey: "model",
            type: "category",
            width: 150,
            tick: { fontSize: 11 },
          }),
          _jsx(Tooltip, {
            content: _jsx(ChartTooltipContent, {}),
            formatter: (v) => formatCurrency(Number(v)),
          }),
          _jsx(Bar, { dataKey: "total_spend", fill: CHART_COLORS[0] }),
        ],
      }),
    }),
  });
}
