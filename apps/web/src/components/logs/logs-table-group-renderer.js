import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TableCell, TableRow } from "../ui/table";
import { renderLogCell } from "./logs-table-cell";
import { renderGroupSummaryCell } from "./logs-table-summary-row";
export function LogsTableGroupRenderer({
  group,
  groupKey,
  isExpanded,
  summary,
  tableColumns,
  showGroupExpanderColumn,
  onToggleGroup,
  onSelectLog,
}) {
  const { model, logs: groupLogs } = group;
  return _jsxs(
    Fragment,
    {
      children: [
        _jsxs(TableRow, {
          className: "cursor-pointer bg-muted/50 hover:bg-muted",
          onClick: onToggleGroup,
          children: [
            _jsx(TableCell, {
              className: "w-10",
              children: isExpanded
                ? _jsx(ChevronDownIcon, {
                    className: "h-4 w-4 text-muted-foreground",
                  })
                : _jsx(ChevronRightIcon, {
                    className: "h-4 w-4 text-muted-foreground",
                  }),
            }),
            tableColumns.map((column) =>
              _jsx(
                TableCell,
                {
                  className: column.align === "right" ? "text-right" : "",
                  children: renderGroupSummaryCell({
                    model,
                    groupLogs,
                    summary,
                    column,
                  }),
                },
                column.key,
              ),
            ),
          ],
        }),
        isExpanded &&
          groupLogs.map((log) =>
            _jsxs(
              TableRow,
              {
                className: "cursor-pointer hover:bg-muted/50",
                onClick: () => onSelectLog(log),
                children: [
                  showGroupExpanderColumn
                    ? _jsx(TableCell, { className: "w-10" })
                    : null,
                  tableColumns.map((column) =>
                    _jsx(
                      TableCell,
                      {
                        className: column.align === "right" ? "text-right" : "",
                        children: renderLogCell({
                          log,
                          columnKey: column.key,
                        }),
                      },
                      `${log.request_id}-${column.key}`,
                    ),
                  ),
                ],
              },
              log.request_id,
            ),
          ),
      ],
    },
    groupKey,
  );
}
