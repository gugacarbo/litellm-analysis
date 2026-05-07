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
  CHART_HEIGHT,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailErrorTrendChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Error Trend ", rangeLabel && `(${rangeLabel})`],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : data.length > 0
            ? _jsx(ResponsiveContainer, {
                width: "100%",
                height: CHART_HEIGHT,
                children: _jsxs(LineChart, {
                  data: data,
                  children: [
                    _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                    _jsx(XAxis, { dataKey: "date" }),
                    _jsx(YAxis, {
                      tickFormatter: (v) => formatNumber(Number(v)),
                    }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v) => [formatNumber(Number(v)), "Errors"],
                    }),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "errorCount",
                      name: "Error Count",
                      stroke: "hsl(var(--destructive))",
                      strokeWidth: 2,
                      dot: false,
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No error trend data available",
              }),
      }),
    ],
  });
}
