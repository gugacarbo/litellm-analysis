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
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailErrorBreakdown({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Error Breakdown ", rangeLabel && `(${rangeLabel})`],
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
                  data: data.slice(0, 8),
                  layout: "vertical",
                  children: [
                    _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                    _jsx(XAxis, {
                      type: "number",
                      tickFormatter: formatNumber,
                    }),
                    _jsx(YAxis, {
                      dataKey: "errorType",
                      type: "category",
                      width: 180,
                      tick: { fontSize: 11 },
                    }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v) => formatNumber(Number(v)),
                    }),
                    _jsx(Bar, {
                      dataKey: "count",
                      fill: "#ef4444",
                      name: "Errors",
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No errors recorded",
              }),
      }),
    ],
  });
}
