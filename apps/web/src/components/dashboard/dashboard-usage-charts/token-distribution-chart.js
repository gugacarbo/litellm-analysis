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
import { formatNumber } from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { Skeleton } from "../../ui/skeleton";
export function TokenDistributionChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Token Distribution by Model (", rangeLabel, ")"],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : _jsx(ResponsiveContainer, {
              width: "100%",
              height: 300,
              children: _jsxs(BarChart, {
                data: data.slice(0, 10),
                layout: "vertical",
                children: [
                  _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                  _jsx(XAxis, { type: "number", tickFormatter: formatNumber }),
                  _jsx(YAxis, {
                    dataKey: "model",
                    type: "category",
                    width: 120,
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
                    fill: "#3b82f6",
                    stackId: "a",
                    maxBarSize: 30,
                  }),
                  _jsx(Bar, {
                    dataKey: "completion_tokens",
                    name: "Output Tokens",
                    fill: "#10b981",
                    stackId: "a",
                    maxBarSize: 30,
                  }),
                ],
              }),
            }),
      }),
    ],
  });
}
