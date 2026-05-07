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
  formatCurrency,
  formatNumber,
} from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ChartTooltipContent } from "../../ui/chart-tooltip";
import { Skeleton } from "../../ui/skeleton";
export function HourlyPatternChart({ data, loading, rangeLabel }) {
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const hourData = data.find((h) => h.hour === i);
    return {
      hour: i,
      requests: hourData?.request_count || 0,
      spend: hourData?.total_spend || 0,
    };
  });
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Hourly Usage Pattern (", rangeLabel, ")"],
        }),
      }),
      _jsx(CardContent, {
        children: loading
          ? _jsx(Skeleton, { className: "h-64 w-full" })
          : _jsx(ResponsiveContainer, {
              width: "100%",
              height: 300,
              children: _jsxs(AreaChart, {
                data: chartData,
                children: [
                  _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                  _jsx(XAxis, {
                    dataKey: "hour",
                    tickFormatter: (v) => `${v}:00`,
                  }),
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
                  _jsx(Tooltip, {
                    content: _jsx(ChartTooltipContent, {}),
                    formatter: (v, key) =>
                      String(key).toLowerCase().includes("spend")
                        ? formatCurrency(Number(v))
                        : formatNumber(Number(v)),
                  }),
                  _jsx(Legend, {}),
                  _jsx(Area, {
                    type: "monotone",
                    dataKey: "requests",
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
            }),
      }),
    ],
  });
}
