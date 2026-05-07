import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
export function DashboardTopEntities({
  loading,
  rangeLabel,
  apiKeyStats,
  spendByUser,
}) {
  const [tab, setTab] = useState("keys");
  const keySkeletonRows = Array.from({ length: 5 }).map((_, i) =>
    _jsxs(
      TableRow,
      {
        children: [
          _jsx(TableCell, {
            children: _jsx(Skeleton, { className: "h-4 w-24" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-12 ml-auto" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-16 ml-auto" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-16 ml-auto" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-12 ml-auto" }),
          }),
        ],
      },
      i,
    ),
  );
  const userSkeletonRows = Array.from({ length: 5 }).map((_, i) =>
    _jsxs(
      TableRow,
      {
        children: [
          _jsx(TableCell, {
            children: _jsx(Skeleton, { className: "h-4 w-24" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-16 ml-auto" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-20 ml-auto" }),
          }),
          _jsx(TableCell, {
            className: "text-right",
            children: _jsx(Skeleton, { className: "h-4 w-12 ml-auto" }),
          }),
        ],
      },
      i,
    ),
  );
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Top Entities (", rangeLabel, ")"],
        }),
      }),
      _jsx(CardContent, {
        children: _jsxs(Tabs, {
          value: tab,
          onValueChange: setTab,
          children: [
            _jsxs(TabsList, {
              variant: "line",
              className: "mb-4",
              children: [
                _jsx(TabsTrigger, { value: "keys", children: "By API Key" }),
                _jsx(TabsTrigger, { value: "users", children: "By User" }),
              ],
            }),
            _jsx(TabsContent, {
              value: "keys",
              children: _jsxs(Table, {
                children: [
                  _jsx(TableHeader, {
                    children: _jsxs(TableRow, {
                      children: [
                        _jsx(TableHead, { children: "API Key" }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Requests",
                        }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Spend",
                        }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Tokens",
                        }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Success",
                        }),
                      ],
                    }),
                  }),
                  _jsx(TableBody, {
                    children: loading
                      ? keySkeletonRows
                      : apiKeyStats.slice(0, 10).map((k) =>
                          _jsxs(
                            TableRow,
                            {
                              children: [
                                _jsxs(TableCell, {
                                  className: "font-mono text-xs",
                                  children: [
                                    (k.key || "N/A").slice(0, 12),
                                    "...",
                                  ],
                                }),
                                _jsx(TableCell, {
                                  className: "text-right",
                                  children: formatNumber(k.request_count),
                                }),
                                _jsx(TableCell, {
                                  className: "text-right",
                                  children: formatCurrency(k.total_spend),
                                }),
                                _jsx(TableCell, {
                                  className: "text-right",
                                  children: formatNumber(k.total_tokens),
                                }),
                                _jsx(TableCell, {
                                  className: `text-right ${
                                    k.success_rate > 95
                                      ? "text-green-600"
                                      : k.success_rate > 90
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`,
                                  children: formatPercent(k.success_rate),
                                }),
                              ],
                            },
                            k.key,
                          ),
                        ),
                  }),
                ],
              }),
            }),
            _jsx(TabsContent, {
              value: "users",
              children: _jsxs(Table, {
                children: [
                  _jsx(TableHeader, {
                    children: _jsxs(TableRow, {
                      children: [
                        _jsx(TableHead, { children: "User" }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Total Spend",
                        }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Tokens",
                        }),
                        _jsx(TableHead, {
                          className: "text-right",
                          children: "Requests",
                        }),
                      ],
                    }),
                  }),
                  _jsx(TableBody, {
                    children: loading
                      ? userSkeletonRows
                      : spendByUser.slice(0, 10).map((u, i) =>
                          _jsxs(
                            TableRow,
                            {
                              children: [
                                _jsx(TableCell, {
                                  className: "font-medium",
                                  children: u.user || "Anonymous",
                                }),
                                _jsx(TableCell, {
                                  className: "text-right",
                                  children: formatCurrency(u.total_spend),
                                }),
                                _jsx(TableCell, {
                                  className: "text-right",
                                  children: formatNumber(u.total_tokens),
                                }),
                                _jsx(TableCell, {
                                  className: "text-right",
                                  children: formatNumber(u.request_count),
                                }),
                              ],
                            },
                            i,
                          ),
                        ),
                  }),
                ],
              }),
            }),
          ],
        }),
      }),
    ],
  });
}
