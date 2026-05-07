import { ChevronDownIcon, Search } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DASHBOARD_DATE_RANGES } from "@/pages/dashboard/dashboard-utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
export function ModelStatsHeader({
  columns,
  visibleColumns,
  searchQuery,
  onToggleColumn,
  onSearchChange,
  selectedDateRange,
  setSelectedDateRange,
}) {
  return _jsx("div", {
    className: "flex items-center justify-between flex-1",
    children: _jsxs("div", {
      className: "flex items-center gap-4 flex-1",
      children: [
        _jsxs("div", {
          className: "relative",
          children: [
            _jsx(Search, {
              className:
                "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground",
            }),
            _jsx("input", {
              type: "text",
              placeholder: "Filter models...",
              value: searchQuery,
              onChange: (e) => onSearchChange(e.target.value),
              className:
                "pl-8 pr-3 py-1.5 border rounded-md text-sm w-52 bg-background",
            }),
          ],
        }),
        _jsx("div", {
          className: "flex flex-wrap items-center gap-1.5",
          children: DASHBOARD_DATE_RANGES.map((option) =>
            _jsx(
              Button,
              {
                variant:
                  option.key === selectedDateRange ? "default" : "outline",
                size: "sm",
                className: "h-7 text-xs",
                onClick: () => setSelectedDateRange(option.key),
                children: option.label,
              },
              option.key,
            ),
          ),
        }),
        _jsxs(DropdownMenu, {
          children: [
            _jsx(DropdownMenuTrigger, {
              asChild: true,
              children: _jsxs(Button, {
                variant: "outline",
                size: "sm",
                className: "ml-auto",
                children: [
                  "Columns ",
                  _jsx(ChevronDownIcon, { className: "ml-2 h-4 w-4" }),
                ],
              }),
            }),
            _jsxs(DropdownMenuContent, {
              align: "end",
              children: [
                _jsx(DropdownMenuLabel, { children: "Toggle Columns" }),
                _jsx(DropdownMenuSeparator, {}),
                columns.map((col) =>
                  _jsx(
                    DropdownMenuCheckboxItem,
                    {
                      checked: visibleColumns.includes(col.key),
                      onCheckedChange: () => onToggleColumn(col.key),
                      children: col.label,
                    },
                    col.key,
                  ),
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
