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
import {
  CHART_HEIGHT,
  formatCurrency,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailHourlyChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Hourly Usage Pattern ", rangeLabel && `(${rangeLabel})`],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : data.length > 0
            ? _jsx(ResponsiveContainer, {
                width: "100%",
                height: CHART_HEIGHT,
                children: _jsxs(BarChart, {
                  data: data,
                  children: [
                    _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                    _jsx(XAxis, {
                      dataKey: "hour",
                      tickFormatter: (v) => `${String(v).padStart(2, "0")}:00`,
                    }),
                    _jsx(YAxis, {}),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v, name) => {
                        if (name === "totalSpend")
                          return formatCurrency(Number(v));
                        return [
                          Number(v).toLocaleString(),
                          name === "requestCount" ? "Requests" : "Tokens",
                        ];
                      },
                      labelFormatter: (label) =>
                        `${String(label).padStart(2, "0")}:00 - ${String(Number(label) + 1).padStart(2, "0")}:00`,
                    }),
                    _jsx(Bar, {
                      dataKey: "requestCount",
                      name: "Requests",
                      fill: "hsl(var(--chart-1))",
                      radius: [4, 4, 0, 0],
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No hourly data available",
              }),
      }),
    ],
  });
}
