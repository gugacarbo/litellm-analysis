import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import {
  Bar,
  BarChart,
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
  formatCurrency,
} from "../../pages/model-detail/model-detail-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartTooltipContent } from "../ui/chart-tooltip";
import { Skeleton } from "../ui/skeleton";
export function ModelDetailCostChart({ data, loading, rangeLabel }) {
  const costPerTokenData = data.map((item) => ({
    ...item,
    costPerMTokens:
      item.totalTokens > 0 ? (item.spend / item.totalTokens) * 1_000_000 : 0,
  }));
  return _jsxs(_Fragment, {
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: ["Cost Trend ", rangeLabel && `(${rangeLabel})`],
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
                          tickFormatter: (v) => formatCurrency(Number(v)),
                        }),
                        _jsx(Tooltip, {
                          content: _jsx(ChartTooltipContent, {}),
                          formatter: (v) => formatCurrency(Number(v)),
                        }),
                        _jsx(Line, {
                          type: "monotone",
                          dataKey: "spend",
                          name: "Spend",
                          stroke: "#3b82f6",
                          strokeWidth: 2,
                          dot: false,
                        }),
                      ],
                    }),
                  })
                : _jsx("div", {
                    className:
                      "flex h-64 items-center justify-center text-muted-foreground",
                    children: "No cost data available",
                  }),
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: [
                "Cost per Million Tokens ",
                rangeLabel && `(${rangeLabel})`,
              ],
            }),
          }),
          _jsx(CardContent, {
            children: loading
              ? _jsx(Skeleton, { className: "h-64 w-full" })
              : costPerTokenData.length > 0
                ? _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: CHART_HEIGHT,
                    children: _jsxs(BarChart, {
                      data: costPerTokenData,
                      children: [
                        _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                        _jsx(XAxis, { dataKey: "date" }),
                        _jsx(YAxis, {
                          tickFormatter: (v) => formatCurrency(Number(v)),
                        }),
                        _jsx(Tooltip, {
                          content: _jsx(ChartTooltipContent, {}),
                          formatter: (v) => formatCurrency(Number(v)),
                        }),
                        _jsx(Bar, {
                          dataKey: "costPerMTokens",
                          name: "Cost/M tokens",
                          fill: "#3b82f6",
                          radius: [4, 4, 0, 0],
                        }),
                      ],
                    }),
                  })
                : _jsx("div", {
                    className:
                      "flex h-64 items-center justify-center text-muted-foreground",
                    children: "No cost data available",
                  }),
          }),
        ],
      }),
    ],
  });
}
