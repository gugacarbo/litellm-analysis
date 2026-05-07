import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function SeverityBreakdownChart({ data, loading }) {
  if (loading) {
    return _jsx(Card, {
      children: _jsx(Skeleton, { className: "h-[240px] w-full" }),
    });
  }
  if (data.length === 0) {
    return _jsx(Card, {
      children: _jsx(CardContent, {
        className: cn("flex items-center justify-center h-[240px]"),
        children: _jsx("p", {
          className: "text-sm text-muted-foreground",
          children: "No alerts",
        }),
      }),
    });
  }
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsx(CardTitle, { children: "Alerts by Severity" }),
      }),
      _jsx(CardContent, {
        children: _jsx(ResponsiveContainer, {
          width: "100%",
          height: 240,
          children: _jsxs(PieChart, {
            children: [
              _jsx(Pie, {
                data: data,
                dataKey: "value",
                nameKey: "name",
                cx: "50%",
                cy: "50%",
                innerRadius: 55,
                outerRadius: 90,
                paddingAngle: 2,
                children: data.map((item, index) =>
                  _jsx(Cell, { fill: item.color }, `cell-${index}`),
                ),
              }),
              _jsx(Tooltip, { content: _jsx(ChartTooltipContent, {}) }),
              _jsx(Legend, {}),
            ],
          }),
        }),
      }),
    ],
  });
}
