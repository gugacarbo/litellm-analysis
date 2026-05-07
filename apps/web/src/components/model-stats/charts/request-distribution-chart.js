import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, CHART_HEIGHT } from "@/lib/chart-colors";
import { formatNumber } from "@/pages/model-stats/model-stats-utils";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { ChartCard } from "./chart-card";
export function RequestDistributionChart({
  loading,
  modelDistribution,
  rangeLabel,
}) {
  const sliced = modelDistribution.slice(0, 6);
  return _jsx(ChartCard, {
    title: `Request Distribution (${rangeLabel})`,
    loading: loading,
    hasData: modelDistribution.length > 0,
    children: _jsx(ResponsiveContainer, {
      width: "100%",
      height: CHART_HEIGHT,
      children: _jsxs(PieChart, {
        children: [
          _jsx(Pie, {
            data: sliced,
            dataKey: "request_count",
            nameKey: "model",
            cx: "50%",
            cy: "50%",
            outerRadius: 100,
            label: ({ name, payload }) =>
              `${name}: ${Number(payload?.percentage ?? 0).toFixed(1)}%`,
            labelLine: false,
            children: sliced.map((_, index) =>
              _jsx(
                Cell,
                { fill: CHART_COLORS[index % CHART_COLORS.length] },
                `cell-${index}`,
              ),
            ),
          }),
          _jsx(Tooltip, {
            content: _jsx(ChartTooltipContent, {}),
            formatter: (value, _name, item) => {
              const pct = Number(item?.payload?.percentage ?? 0);
              return `${formatNumber(Number(value))} (${pct.toFixed(1)}%)`;
            },
          }),
        ],
      }),
    }),
  });
}
