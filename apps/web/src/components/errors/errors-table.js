import { ChevronDownIcon, RefreshCw, SlidersHorizontal } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE } from "@/lib/locale";
import { cn } from "../../lib/utils";
import { LogsPaginationControls } from "../logs/logs-pagination-controls";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { renderErrorCell } from "./errors-table-cell";
import { ACTIONS_COLUMN, ERROR_COLUMNS } from "./errors-table-columns";

export { DEFAULT_VISIBLE_ERROR_COLUMNS } from "./errors-table-columns";
export function ErrorsTable({
  errors,
  loading,
  refreshing,
  page,
  pageSize,
  pagination,
  visibleColumns,
  autoRefetchEnabled,
  onSelectError,
  onToggleColumn,
  onAutoRefetchChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}) {
  const isFetching = loading || refreshing;
  const isRefetching = refreshing && !loading;
  const tableColumns = [
    ...ERROR_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
    ACTIONS_COLUMN,
  ];
  const hasAnyErrors = pagination.total > 0;
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        className: "border-b",
        children: _jsxs("div", {
          className:
            "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
          children: [
            _jsxs("div", {
              className: "space-y-1",
              children: [
                _jsx(CardTitle, { children: "Recent Errors" }),
                _jsx(CardDescription, {
                  children: loading
                    ? "Loading errors..."
                    : hasAnyErrors
                      ? `${pagination.total.toLocaleString(APP_LOCALE)} matching records`
                      : "No matching errors for current filters",
                }),
              ],
            }),
            _jsxs("div", {
              className: "flex flex-wrap items-center gap-2",
              children: [
                _jsxs("div", {
                  className:
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5",
                  children: [
                    _jsx(Switch, {
                      id: "errors-auto-refetch",
                      checked: autoRefetchEnabled,
                      onCheckedChange: onAutoRefetchChange,
                    }),
                    _jsx(Label, {
                      htmlFor: "errors-auto-refetch",
                      className: "text-xs text-muted-foreground",
                      children: "Auto refetch 5s",
                    }),
                  ],
                }),
                _jsxs(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: onRefetch,
                  disabled: isFetching,
                  children: [
                    _jsx(RefreshCw, {
                      className: cn(
                        "mr-1 h-3.5 w-3.5",
                        isFetching ? "animate-spin" : "",
                      ),
                    }),
                    isRefetching ? "Refetching..." : "Refresh",
                  ],
                }),
                _jsxs(DropdownMenu, {
                  children: [
                    _jsx(DropdownMenuTrigger, {
                      asChild: true,
                      children: _jsxs(Button, {
                        variant: "outline",
                        size: "sm",
                        children: [
                          _jsx(SlidersHorizontal, {
                            className: "mr-1 h-3.5 w-3.5",
                          }),
                          "Columns",
                          _jsx(ChevronDownIcon, { className: "ml-1 h-4 w-4" }),
                        ],
                      }),
                    }),
                    _jsxs(DropdownMenuContent, {
                      align: "end",
                      className: "w-56",
                      children: [
                        _jsx(DropdownMenuLabel, {
                          children: "Visible Columns",
                        }),
                        _jsx(DropdownMenuSeparator, {}),
                        ERROR_COLUMNS.map((column) => {
                          const checked = visibleColumns.includes(column.key);
                          return _jsx(
                            DropdownMenuCheckboxItem,
                            {
                              checked: checked,
                              disabled: checked && visibleColumns.length === 1,
                              onCheckedChange: () => onToggleColumn(column.key),
                              children: column.label,
                            },
                            column.key,
                          );
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsxs(CardContent, {
        className: "space-y-4",
        children: [
          _jsx("div", {
            className: "overflow-x-auto rounded-lg border",
            children: _jsxs(Table, {
              children: [
                _jsx(TableHeader, {
                  children: _jsx(TableRow, {
                    children: tableColumns.map((column) =>
                      _jsx(
                        TableHead,
                        {
                          className:
                            column.align === "right" ? "text-right" : "",
                          children: column.label,
                        },
                        column.key,
                      ),
                    ),
                  }),
                }),
                _jsx(TableBody, {
                  children:
                    loading && errors.length === 0
                      ? Array.from({ length: 10 }).map((_, rowIndex) =>
                          _jsx(
                            TableRow,
                            {
                              children: tableColumns.map((column) =>
                                _jsx(
                                  TableCell,
                                  {
                                    className:
                                      column.align === "right"
                                        ? "text-right"
                                        : "",
                                    children: _jsx(Skeleton, {
                                      className:
                                        column.align === "right"
                                          ? "h-4 w-14 ml-auto"
                                          : "h-4 w-24",
                                    }),
                                  },
                                  `${rowIndex}-${column.key}`,
                                ),
                              ),
                            },
                            rowIndex,
                          ),
                        )
                      : errors.length === 0
                        ? _jsx(TableRow, {
                            children: _jsx(TableCell, {
                              colSpan: tableColumns.length,
                              className:
                                "py-8 text-center text-muted-foreground",
                              children: "No errors found",
                            }),
                          })
                        : errors.map((errorLog) =>
                            _jsx(
                              TableRow,
                              {
                                children: tableColumns.map((column) =>
                                  _jsx(
                                    TableCell,
                                    {
                                      className:
                                        column.align === "right"
                                          ? "text-right"
                                          : "",
                                      children: renderErrorCell({
                                        errorLog,
                                        columnKey: column.key,
                                        onSelectError,
                                      }),
                                    },
                                    `${errorLog.id}-${column.key}`,
                                  ),
                                ),
                              },
                              errorLog.id,
                            ),
                          ),
                }),
              ],
            }),
          }),
          _jsx(LogsPaginationControls, {
            page: page,
            pageSize: pageSize,
            pagination: pagination,
            onPageChange: onPageChange,
            onPageSizeChange: onPageSizeChange,
          }),
        ],
      }),
    ],
  });
}
