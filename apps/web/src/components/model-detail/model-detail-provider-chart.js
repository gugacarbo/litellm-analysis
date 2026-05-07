import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "../../lib/chart-colors";
import {
  CHART_HEIGHT,
  formatCurrency,
  formatDuration,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailProviderChart({ data, loading }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsx(CardTitle, { children: "Provider Breakdown" }),
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
                    _jsx(XAxis, { dataKey: "provider" }),
                    _jsx(YAxis, {
                      tickFormatter: (v) => formatNumber(Number(v)),
                    }),
                    _jsx(Tooltip, {
                      content: _jsx(ChartTooltipContent, {}),
                      formatter: (v, name) => {
                        if (name === "total_spend")
                          return [formatCurrency(Number(v)), "Spend"];
                        if (name === "avg_latency_ms")
                          return [formatDuration(Number(v)), "Avg Latency"];
                        return [formatNumber(Number(v)), "Requests"];
                      },
                    }),
                    _jsx(Legend, {}),
                    _jsx(Bar, {
                      dataKey: "request_count",
                      name: "Requests",
                      radius: [4, 4, 0, 0],
                      children: data.map((entry, index) =>
                        _jsx(
                          Cell,
                          { fill: CHART_COLORS[index % CHART_COLORS.length] },
                          entry.provider,
                        ),
                      ),
                    }),
                  ],
                }),
              })
            : _jsx("div", {
                className:
                  "flex h-64 items-center justify-center text-muted-foreground",
                children: "No provider data available",
              }),
      }),
    ],
  });
}
