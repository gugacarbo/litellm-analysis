import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import {
  Area,
  AreaChart,
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
export function ModelDetailTokenEfficiency({ data, loading, rangeLabel }) {
  const ratioData = data.map((item) => ({
    ...item,
    inputOutputRatio:
      item.completionTokens > 0
        ? item.promptTokens / item.completionTokens
        : item.promptTokens > 0
          ? Infinity
          : 0,
  }));
  return _jsxs(_Fragment, {
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: [
                "Token Usage Breakdown ",
                rangeLabel && `(${rangeLabel})`,
              ],
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
                        _jsx(Area, {
                          type: "monotone",
                          dataKey: "promptTokens",
                          name: "Input Tokens",
                          stackId: "1",
                          stroke: "#3b82f6",
                          fill: "#3b82f6",
                          fillOpacity: 0.6,
                        }),
                        _jsx(Area, {
                          type: "monotone",
                          dataKey: "completionTokens",
                          name: "Output Tokens",
                          stackId: "1",
                          stroke: "#ef4444",
                          fill: "#ef4444",
                          fillOpacity: 0.6,
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
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              children: [
                "Input/Output Ratio ",
                rangeLabel && `(${rangeLabel})`,
              ],
            }),
          }),
          _jsx(CardContent, {
            children: loading
              ? _jsx(Skeleton, { className: "h-64 w-full" })
              : ratioData.length > 0
                ? _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: CHART_HEIGHT,
                    children: _jsxs(LineChart, {
                      data: ratioData,
                      children: [
                        _jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                        _jsx(XAxis, { dataKey: "date" }),
                        _jsx(YAxis, {
                          tickFormatter: (v) => `${Number(v).toFixed(1)}x`,
                        }),
                        _jsx(Tooltip, {
                          content: _jsx(ChartTooltipContent, {}),
                          formatter: (v) => {
                            const n = Number(v);
                            if (!Number.isFinite(n)) return ["N/A", "Ratio"];
                            return [`${n.toFixed(2)}x`, "Input/Output Ratio"];
                          },
                        }),
                        _jsx(Line, {
                          type: "monotone",
                          dataKey: "inputOutputRatio",
                          name: "Input/Output Ratio",
                          stroke: "#8b5cf6",
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
      }),
    ],
  });
}
