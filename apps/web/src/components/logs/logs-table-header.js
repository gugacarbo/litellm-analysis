import { ChevronDownIcon, RefreshCw, SlidersHorizontal } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE } from "@/lib/locale";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { LOG_COLUMNS } from "./logs-table-columns";
export function LogsTableHeader({
  loading,
  paginationTotal,
  groupByModel,
  autoRefetchEnabled,
  isFetching,
  visibleColumns,
  onGroupByModelChange,
  onAutoRefetchChange,
  onRefetch,
  onToggleColumn,
}) {
  const hasAnyLogs = paginationTotal > 0;
  return _jsx(CardHeader, {
    className: "border-b",
    children: _jsxs("div", {
      className:
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
      children: [
        _jsxs("div", {
          className: "space-y-1",
          children: [
            _jsx(CardTitle, { children: "Recent Requests" }),
            _jsx(CardDescription, {
              children: loading
                ? "Loading logs..."
                : hasAnyLogs
                  ? `${paginationTotal.toLocaleString(APP_LOCALE)} matching records`
                  : "No matching logs for current filters",
            }),
          ],
        }),
        _jsxs("div", {
          className: "flex flex-wrap items-center gap-2",
          children: [
            _jsxs(Button, {
              variant: groupByModel ? "default" : "outline",
              size: "sm",
              onClick: () => onGroupByModelChange(!groupByModel),
              children: [
                _jsx(ChevronDownIcon, {
                  className: cn(
                    "mr-1 h-3.5 w-3.5 transition-transform",
                    !groupByModel && "-rotate-90",
                  ),
                }),
                "Group by Model",
              ],
            }),
            _jsxs("div", {
              className:
                "flex items-center gap-2 rounded-lg border px-3 py-1.5",
              children: [
                _jsx(Switch, {
                  id: "logs-auto-refetch",
                  checked: autoRefetchEnabled,
                  onCheckedChange: onAutoRefetchChange,
                }),
                _jsx(Label, {
                  htmlFor: "logs-auto-refetch",
                  className: "text-xs text-muted-foreground",
                  children: "Auto refetch 15s",
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
                "Refresh",
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
                    _jsx(DropdownMenuLabel, { children: "Visible Columns" }),
                    _jsx(DropdownMenuSeparator, {}),
                    LOG_COLUMNS.map((column) => {
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
  });
}
