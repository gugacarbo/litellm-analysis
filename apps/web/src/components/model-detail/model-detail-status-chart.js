import { useMemo } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  CHART_HEIGHT,
  formatNumber,
  formatPercent,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";

const STATUS_COLORS = {
  success: "#22c55e",
  failure: "#ef4444",
  error: "#ef4444",
};
export function ModelDetailStatusChart({ data, loading }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage,
      fill:
        STATUS_COLORS[item.status.toLowerCase()] ??
        `hsl(var(--chart-${(data.indexOf(item) % 5) + 1}))`,
    }));
  }, [data]);
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsx(CardTitle, { children: "Status Distribution" }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : chartData.length > 0
            ? _jsx(ResponsiveContainer, {
                width: "100%",
                height: CHART_HEIGHT,
                children: _jsxs(PieChart, {
                  children: [
                    _jsx(Pie, {
                      data: chartData,
                      dataKey: "value",
                      nameKey: "name",
                      cx: "50%",
                      cy: "50%",
                      innerRadius: 60,
                      outerRadius: 100,
                      paddingAngle: 2,
                      children: chartData.map((entry) =>
                        _jsx(Cell, { fill: entry.fill }, entry.name),
                      ),
                    }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v, name) => {
                        const item = chartData.find((d) => d.name === name);
                        const pct = item ? formatPercent(item.percentage) : "";
                        return [`${formatNumber(Number(v))} (${pct})`, name];
                      },
                    }),
                    _jsx(Legend, {}),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No status data available",
              }),
      }),
    ],
  });
}
