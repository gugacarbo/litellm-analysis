import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCurrency,
  formatDate,
} from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { Skeleton } from "../../ui/skeleton";
export function DailySpendChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Daily Spend Trend (", rangeLabel, ")"],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : _jsx(ResponsiveContainer, {
              width: "100%",
              height: 300,
              children: _jsxs(LineChart, {
                data: data,
                children: [
                  _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                  _jsx(XAxis, { dataKey: "date", tickFormatter: formatDate }),
                  _jsx(YAxis, { tickFormatter: (v) => `$${v}` }),
                  _jsx(Tooltip, {
                    content: _jsx(ChartTooltipContent, {}),
                    formatter: (v) => formatCurrency(Number(v)),
                  }),
                  _jsx(Line, {
                    type: "monotone",
                    dataKey: "spend",
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    dot: false,
                  }),
                ],
              }),
            }),
      }),
    ],
  });
}
