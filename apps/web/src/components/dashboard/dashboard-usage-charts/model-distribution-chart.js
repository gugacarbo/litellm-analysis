import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { Skeleton } from "../../ui/skeleton";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];
export function ModelDistributionChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Model Usage Distribution (", rangeLabel, ")"],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : _jsx(ResponsiveContainer, {
              width: "100%",
              height: 300,
              children: _jsxs(PieChart, {
                children: [
                  _jsx(Pie, {
                    data: data.slice(0, 8),
                    dataKey: "request_count",
                    nameKey: "model",
                    cx: "50%",
                    cy: "50%",
                    outerRadius: 100,
                    label: ({ name, payload }) =>
                      `${name}: ${Number(payload?.percentage ?? 0).toFixed(1)}%`,
                    labelLine: false,
                    children: data
                      .slice(0, 8)
                      .map((_, index) =>
                        _jsx(
                          Cell,
                          { fill: COLORS[index % COLORS.length] },
                          `cell-${index}`,
                        ),
                      ),
                  }),
                  _jsx(Tooltip, {
                    content: _jsx(ChartTooltipContent, {}),
                    formatter: (value, _name, item) => {
                      const percentage = Number(item.payload?.percentage ?? 0);
                      return `${formatNumber(Number(value))} (${percentage.toFixed(1)}%)`;
                    },
                  }),
                ],
              }),
            }),
      }),
    ],
  });
}
