import type {
  PaginationMetadata,
  SpendLog,
} from "@lite-llm/contracts/analytics";
import type {
  ColumnDef,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { LogsPaginationControls } from "./logs-pagination-controls";
import { renderLogCell } from "./logs-table-cell";
import { LOG_COLUMNS, type LogColumnKey } from "./logs-table-columns";
import { LogsTableGroupRenderer } from "./logs-table-group-renderer";
import { LogsTableHeader } from "./logs-table-header";
import { LogsTableSkeleton } from "./logs-table-skeleton";
import { calculateGroupSummary, groupLogsByModel } from "./logs-table-utils";

export { DEFAULT_VISIBLE_LOG_COLUMNS } from "./logs-table-columns";

type LogsTableProps = {
  logs: SpendLog[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  visibleColumns: LogColumnKey[];
  autoRefetchEnabled: boolean;
  groupByModel: boolean;
  onSelectLog?: (log: SpendLog) => void;
  onToggleColumn: (column: LogColumnKey) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onGroupByModelChange: (enabled: boolean) => void;
  onRefetch: () => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

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
}: LogsTableProps) {
  const navigate = useNavigate();
  const isFetching = loading || refreshing;
  const showGroupExpanderColumn = groupByModel;

  const handleRowClick = (log: SpendLog) => {
    if (onSelectLog) {
      onSelectLog(log);
    }
    navigate(`/logs/${encodeURIComponent(log.request_id)}`);
  };

  const columns: ColumnDef<SpendLog>[] = useMemo(
    () =>
      LOG_COLUMNS.map((col) => ({
        id: col.key,
        accessorKey: col.key,
        header: () => col.label,
        cell: ({ row }) =>
          renderLogCell({
            log: row.original,
            columnKey: col.key,
          }),
        enableSorting: false,
        enableHiding: false,
      })),
    [],
  );

  const visibilityState: VisibilityState = useMemo(() => {
    const state: VisibilityState = {};
    for (const col of LOG_COLUMNS) {
      state[col.key] = visibleColumns.includes(col.key);
    }
    return state;
  }, [visibleColumns]);

  const align: Record<string, "left" | "right" | "center"> = {
    latencyHeat: "right",
    promptTokens: "right",
    completionTokens: "right",
    totalTokens: "right",
    duration: "right",
    timeToFirstToken: "right",
    tokensPerSecond: "right",
    spend: "right",
  };

  const columnLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const col of LOG_COLUMNS) {
      labels[col.key] = col.label;
    }
    return labels;
  }, []);

  const handleColumnVisibilityChange = (
    updaterOrValue: Updater<VisibilityState>,
  ) => {
    const state =
      typeof updaterOrValue === "function"
        ? updaterOrValue(
            Object.fromEntries(LOG_COLUMNS.map((c) => [c.key, true])),
          )
        : updaterOrValue;
    for (const col of LOG_COLUMNS) {
      const currentlyVisible = visibleColumns.includes(col.key);
      const newVisible = state[col.key] !== false;
      if (currentlyVisible !== newVisible) {
        onToggleColumn(col.key);
      }
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      const normalizedA = Number.isNaN(timeA) ? 0 : timeA;
      const normalizedB = Number.isNaN(timeB) ? 0 : timeB;

      if (normalizedA !== normalizedB) {
        return normalizedB - normalizedA;
      }

      return b.request_id.localeCompare(a.request_id);
    });
  }, [logs]);

  const groupedLogs = useMemo(() => {
    if (!groupByModel || sortedLogs.length === 0) return null;

    const groups = groupLogsByModel(sortedLogs);

    const initialExpanded: Record<string, boolean> = {};
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
  }, [groupByModel, sortedLogs, expandedGroups]);

  const handleToggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const tableColumns = LOG_COLUMNS.filter((col) =>
    visibleColumns.includes(col.key),
  );

  return (
    <Card>
      <LogsTableHeader
        loading={loading}
        paginationTotal={pagination.total}
        groupByModel={groupByModel}
        autoRefetchEnabled={autoRefetchEnabled}
        isFetching={isFetching}
        visibleColumns={visibleColumns}
        onGroupByModelChange={onGroupByModelChange}
        onAutoRefetchChange={onAutoRefetchChange}
        onRefetch={onRefetch}
        onToggleColumn={onToggleColumn}
      />
      <CardContent className="space-y-4">
        {groupedLogs ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showGroupExpanderColumn ? (
                    <TableHead className="w-10" aria-label="Expand group" />
                  ) : null}
                  {tableColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={column.align === "right" ? "text-right" : ""}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              {loading && logs.length === 0 ? (
                <TableBody>
                  <LogsTableSkeleton
                    showGroupExpanderColumn={showGroupExpanderColumn}
                    tableColumns={tableColumns}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {groupedLogs.map((group) => {
                    const groupKey = `${group.model}-${group.logs[0].request_id}`;
                    const isExpanded = expandedGroups[groupKey] ?? false;
                    const summary = calculateGroupSummary(group);

                    return (
                      <LogsTableGroupRenderer
                        key={groupKey}
                        group={group}
                        groupKey={groupKey}
                        isExpanded={isExpanded}
                        summary={summary}
                        tableColumns={tableColumns}
                        showGroupExpanderColumn={showGroupExpanderColumn}
                        onToggleGroup={() => handleToggleGroup(groupKey)}
                        onSelectLog={handleRowClick}
                      />
                    );
                  })}
                </TableBody>
              )}
            </Table>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sortedLogs}
            loading={loading && logs.length === 0}
            loadingSkeletonRows={10}
            emptyMessage="No logs found."
            showPagination={false}
            columnVisibility={visibilityState}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            columnLabels={columnLabels}
            align={align}
            onRowClick={handleRowClick}
          />
        )}

        <LogsPaginationControls
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
}
