import { useMemo, useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from "../ui/card";
import { Table, TableHead, TableHeader, TableRow } from "../ui/table";
import { LogsPaginationControls } from "./logs-pagination-controls";
import { LogsTableBody } from "./logs-table-body";
import { LOG_COLUMNS } from "./logs-table-columns";
import { LogsTableHeader } from "./logs-table-header";
import { groupLogsByModel } from "./logs-table-utils";

export { DEFAULT_VISIBLE_LOG_COLUMNS } from "./logs-table-columns";
export function LogsTable({
  logs,
  loading,
  refreshing,
  page,
  pageSize,
  pagination,
  visibleColumns,
  autoRefetchEnabled,
  groupByModel,
  onSelectLog,
  onToggleColumn,
  onAutoRefetchChange,
  onGroupByModelChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}) {
  const isFetching = loading || refreshing;
  const showGroupExpanderColumn = groupByModel;
  const tableColumns = LOG_COLUMNS.filter((column) =>
    visibleColumns.includes(column.key),
  );
  const [expandedGroups, setExpandedGroups] = useState({});
  const groupedLogs = useMemo(() => {
    if (!groupByModel || logs.length === 0) return null;
    const groups = groupLogsByModel(logs);
    const initialExpanded = {};
    for (const group of groups) {
      const key = `${group.model}-${group.logs[0].request_id}`;
      if (expandedGroups[key] === undefined) {
        initialExpanded[key] = false;
      }
    }
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedGroups((prev) => ({ ...prev, ...initialExpanded }));
    }
    return groups;
  }, [groupByModel, logs, expandedGroups]);
  const handleToggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };
  return _jsxs(Card, {
    children: [
      _jsx(LogsTableHeader, {
        loading: loading,
        paginationTotal: pagination.total,
        groupByModel: groupByModel,
        autoRefetchEnabled: autoRefetchEnabled,
        isFetching: isFetching,
        visibleColumns: visibleColumns,
        onGroupByModelChange: onGroupByModelChange,
        onAutoRefetchChange: onAutoRefetchChange,
        onRefetch: onRefetch,
        onToggleColumn: onToggleColumn,
      }),
      _jsxs(CardContent, {
        className: "space-y-4",
        children: [
          _jsx("div", {
            className: "overflow-x-auto rounded-lg border",
            children: _jsxs(Table, {
              children: [
                _jsx(TableHeader, {
                  children: _jsxs(TableRow, {
                    children: [
                      showGroupExpanderColumn
                        ? _jsx(TableHead, {
                            className: "w-10",
                            "aria-label": "Expand group",
                          })
                        : null,
                      tableColumns.map((column) =>
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
                    ],
                  }),
                }),
                _jsx(LogsTableBody, {
                  loading: loading,
                  logs: logs,
                  groupedLogs: groupedLogs,
                  expandedGroups: expandedGroups,
                  tableColumns: tableColumns,
                  showGroupExpanderColumn: showGroupExpanderColumn,
                  onToggleGroup: handleToggleGroup,
                  onSelectLog: onSelectLog,
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
