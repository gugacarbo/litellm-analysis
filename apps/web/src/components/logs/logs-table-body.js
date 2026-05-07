import { jsx as _jsx } from "react/jsx-runtime";
import { TableBody, TableCell, TableRow } from "../ui/table";
import { renderLogCell } from "./logs-table-cell";
import { LogsTableGroupRenderer } from "./logs-table-group-renderer";
import { LogsTableSkeleton } from "./logs-table-skeleton";
import { calculateGroupSummary } from "./logs-table-utils";
export function LogsTableBody({
  loading,
  logs,
  groupedLogs,
  expandedGroups,
  tableColumns,
  showGroupExpanderColumn,
  onToggleGroup,
  onSelectLog,
}) {
  if (loading && logs.length === 0) {
    return _jsx(TableBody, {
      children: _jsx(LogsTableSkeleton, {
        showGroupExpanderColumn: showGroupExpanderColumn,
        tableColumns: tableColumns,
      }),
    });
  }
  if (logs.length === 0) {
    return _jsx(TableBody, {
      children: _jsx(TableRow, {
        children: _jsx(TableCell, {
          colSpan: tableColumns.length + (showGroupExpanderColumn ? 1 : 0),
          className: "py-8 text-center text-muted-foreground",
          children: "No logs found",
        }),
      }),
    });
  }
  if (groupedLogs) {
    return _jsx(TableBody, {
      children: groupedLogs.map((group) => {
        const groupKey = `${group.model}-${group.logs[0].request_id}`;
        const isExpanded = expandedGroups[groupKey] ?? false;
        const summary = calculateGroupSummary(group);
        return _jsx(
          LogsTableGroupRenderer,
          {
            group: group,
            groupKey: groupKey,
            isExpanded: isExpanded,
            summary: summary,
            tableColumns: tableColumns,
            showGroupExpanderColumn: showGroupExpanderColumn,
            onToggleGroup: () => onToggleGroup(groupKey),
            onSelectLog: onSelectLog,
          },
          groupKey,
        );
      }),
    });
  }
  return _jsx(TableBody, {
    children: logs.map((log) =>
      _jsx(
        TableRow,
        {
          className: "cursor-pointer hover:bg-muted/50",
          onClick: () => onSelectLog(log),
          children: tableColumns.map((column) =>
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
        },
        log.request_id,
      ),
    ),
  });
}
