import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_HEIGHT,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailTokenBreakdown({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Token Usage Trend ", rangeLabel && `(${rangeLabel})`],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : data.length > 0
            ? _jsx(ResponsiveContainer, {
                width: "100%",
                height: CHART_HEIGHT,
                children: _jsxs(AreaChart, {
                  data: data,
                  children: [
                    _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                    _jsx(XAxis, { dataKey: "date" }),
                    _jsx(YAxis, { tickFormatter: formatNumber }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v) => formatNumber(Number(v)),
                    }),
                    _jsx(Legend, {}),
                    _jsx(Area, {
                      type: "monotone",
                      dataKey: "promptTokens",
                      name: "Input",
                      stackId: "1",
                      stroke: "#3b82f6",
                      fill: "#3b82f6",
                    }),
                    _jsx(Area, {
                      type: "monotone",
                      dataKey: "completionTokens",
                      name: "Output",
                      stackId: "1",
                      stroke: "#10b981",
                      fill: "#10b981",
                    }),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "totalTokens",
                      name: "Total",
                      stroke: "#f59e0b",
                      strokeWidth: 2,
                      dot: false,
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No token data available",
              }),
      }),
    ],
  });
}
