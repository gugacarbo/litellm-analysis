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
  formatCurrency,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailTrendChart({ data, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Daily Spend Trend ", rangeLabel && `(${rangeLabel})`],
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
                    _jsx(YAxis, {
                      yAxisId: "left",
                      tickFormatter: formatNumber,
                      allowDecimals: false,
                    }),
                    _jsx(YAxis, {
                      yAxisId: "right",
                      orientation: "right",
                      tickFormatter: (v) => formatCurrency(Number(v)),
                    }),
                    _jsx(Tooltip, { content: _jsx(ChartTooltipContent, {}) }),
                    _jsx(Legend, {}),
                    _jsx(Area, {
                      type: "monotone",
                      dataKey: "requestCount",
                      name: "Requests",
                      yAxisId: "left",
                      stroke: "#8b5cf6",
                      fill: "#8b5cf6",
                      fillOpacity: 0.3,
                    }),
                    _jsx(Line, {
                      type: "monotone",
                      dataKey: "spend",
                      name: "Spend",
                      yAxisId: "right",
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
                children: "No trend data available",
              }),
      }),
    ],
  });
}
