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
import { CHART_COLORS } from "../../lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function AlertsByTypeChart({ data, loading }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsx(CardTitle, { children: "Alerts by Type" }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-[240px] w-full" })
          : !data || data.length === 0
            ? _jsx("div", {
                className:
                  "flex h-[240px] items-center justify-center text-sm text-muted-foreground",
                children: "No alerts",
              })
            : _jsx(ResponsiveContainer, {
                width: "100%",
                height: 240,
                children: _jsxs(BarChart, {
                  data: data,
                  layout: "vertical",
                  children: [
                    _jsx(CartesianGrid, {
                      strokeDasharray: "3 3",
                      horizontal: false,
                    }),
                    _jsx(XAxis, { type: "number" }),
                    _jsx(YAxis, {
                      dataKey: "type",
                      type: "category",
                      width: 110,
                      tick: { fontSize: 12 },
                    }),
                    _jsx(Tooltip, { content: _jsx(ChartTooltipContent, {}) }),
                    _jsx(Bar, {
                      dataKey: "count",
                      fill: CHART_COLORS[0],
                      radius: [0, 4, 4, 0],
                      maxBarSize: 24,
                    }),
                  ],
                }),
              }),
      }),
    ],
  });
}
