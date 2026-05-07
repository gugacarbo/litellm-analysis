import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../pages/model-detail/model-detail-utils";
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

function maskApiKey(key) {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
export function ModelDetailApiKeyTable({ apiKeys, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Top API Keys ", rangeLabel && `(${rangeLabel})`],
        }),
      }),
      _jsx(CardContent, {
        children: _jsxs(Table, {
          children: [
            _jsx(TableHeader, {
              children: _jsxs(TableRow, {
                children: [
                  _jsx(TableHead, { children: "API Key" }),
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
                    children: "Requests",
                  }),
                  _jsx(TableHead, {
                    className: "text-right",
                    children: "Success Rate",
                  }),
                ],
              }),
            }),
            _jsx(TableBody, {
              children: loading
                ? Array.from({ length: 5 }).map((_, i) =>
                    _jsxs(
                      TableRow,
                      {
                        children: [
                          _jsx(TableCell, {
                            children: _jsx(Skeleton, { className: "h-4 w-32" }),
                          }),
                          _jsx(TableCell, {
                            className: "text-right",
                            children: _jsx(Skeleton, {
                              className: "h-4 w-16 ml-auto",
                            }),
                          }),
                          _jsx(TableCell, {
                            className: "text-right",
                            children: _jsx(Skeleton, {
                              className: "h-4 w-20 ml-auto",
                            }),
                          }),
                          _jsx(TableCell, {
                            className: "text-right",
                            children: _jsx(Skeleton, {
                              className: "h-4 w-12 ml-auto",
                            }),
                          }),
                          _jsx(TableCell, {
                            className: "text-right",
                            children: _jsx(Skeleton, {
                              className: "h-4 w-16 ml-auto",
                            }),
                          }),
                        ],
                      },
                      i,
                    ),
                  )
                : apiKeys.length > 0
                  ? apiKeys.map((key) =>
                      _jsxs(
                        TableRow,
                        {
                          children: [
                            _jsx(TableCell, {
                              className: "font-medium",
                              children: maskApiKey(key.apiKey),
                            }),
                            _jsx(TableCell, {
                              className: "text-right",
                              children: formatCurrency(key.totalSpend),
                            }),
                            _jsx(TableCell, {
                              className: "text-right",
                              children: formatNumber(key.totalTokens),
                            }),
                            _jsx(TableCell, {
                              className: "text-right",
                              children: formatNumber(key.requestCount),
                            }),
                            _jsx(TableCell, {
                              className: "text-right",
                              children: formatPercent(key.successRate),
                            }),
                          ],
                        },
                        key.apiKey,
                      ),
                    )
                  : _jsx(TableRow, {
                      children: _jsx(TableCell, {
                        colSpan: 5,
                        className: "h-24 text-center text-muted-foreground",
                        children: "No API key data available",
                      }),
                    }),
            }),
          ],
        }),
      }),
    ],
  });
}
