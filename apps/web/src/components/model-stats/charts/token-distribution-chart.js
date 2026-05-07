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
import { CHART_COLORS, CHART_HEIGHT } from "@/lib/chart-colors";
import { TOP_N_MODELS } from "@/pages/model-stats/model-stats-chart-utils";
import { formatNumber } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";
export function TokenDistributionChart({
  loading,
  tokenDistribution,
  rangeLabel,
}) {
  return _jsx(ChartCard, {
    title: `Token Distribution by Model (${rangeLabel})`,
    loading: loading,
    hasData: tokenDistribution.length > 0,
    children: _jsx(ResponsiveContainer, {
      width: "100%",
      height: CHART_HEIGHT,
      children: _jsxs(BarChart, {
        data: tokenDistribution.slice(0, TOP_N_MODELS),
        layout: "vertical",
        children: [
          _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          _jsx(XAxis, { type: "number", tickFormatter: formatNumber }),
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
          _jsx(Legend, {}),
          _jsx(Bar, {
            dataKey: "prompt_tokens",
            name: "Input Tokens",
            fill: CHART_COLORS[0],
            stackId: "a",
            maxBarSize: 30,
          }),
          _jsx(Bar, {
            dataKey: "completion_tokens",
            name: "Output Tokens",
            fill: CHART_COLORS[1],
            stackId: "a",
            maxBarSize: 30,
          }),
        ],
      }),
    }),
  });
}
