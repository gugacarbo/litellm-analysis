import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatNumber,
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
export function ModelDetailUserTable({ users, loading, rangeLabel }) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          children: ["Top Users ", rangeLabel && `(${rangeLabel})`],
        }),
      }),
      _jsx(CardContent, {
        children: _jsxs(Table, {
          children: [
            _jsx(TableHeader, {
              children: _jsxs(TableRow, {
                children: [
                  _jsx(TableHead, { children: "User" }),
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
                        ],
                      },
                      i,
                    ),
                  )
                : users.length > 0
                  ? users.map((u) =>
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
                              children: formatCurrency(u.totalSpend),
                            }),
                            _jsx(TableCell, {
                              className: "text-right",
                              children: formatNumber(u.totalTokens),
                            }),
                            _jsx(TableCell, {
                              className: "text-right",
                              children: formatNumber(u.requestCount),
                            }),
                          ],
                        },
                        u.user,
                      ),
                    )
                  : _jsx(TableRow, {
                      children: _jsx(TableCell, {
                        colSpan: 4,
                        className: "h-24 text-center text-muted-foreground",
                        children: "No user data available",
                      }),
                    }),
            }),
          ],
        }),
      }),
    ],
  });
}
