import { Badge } from "../../components/badge";
import { LogDetailDialog } from "../../components/logs/log-detail-dialog";
import { LogsFilterCard } from "../../components/logs/logs-filter-card";
import { LogsTable } from "../../components/logs/logs-table";
import type { SpendLog } from "../../types/analytics";
import {
  type SpendLogFilters,
  type SpendLogsState,
  useSpendLogsState,
} from "./spend-logs-state";

interface SpendLogsTabProps {
  logs: SpendLog[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  modelsQuery: {
    data?: Array<{ modelName: string }>;
    error?: Error | null;
  };
  page: number;
  pageSize: number;
  filters: SpendLogFilters;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: SpendLogFilters) => void;
  refetch: () => void;
}

export function SpendLogsTab({
  logs,
  pagination,
  loading,
  refreshing,
  error,
  modelsQuery,
  page,
  pageSize,
  filters,
  setPage,
  setPageSize,
  setFilters,
  refetch,
}: SpendLogsTabProps) {
  const state: SpendLogsState = useSpendLogsState({
    filters,
    pagination,
    modelsQuery,
    setPage,
    setPageSize,
    setFilters,
    refetch,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="outline">
          {pagination.total.toLocaleString("en-US")} logs
        </Badge>
        <Badge variant="outline">
          {state.activeFiltersCount > 0
            ? `${state.activeFiltersCount} active filters`
            : "No active filters"}
        </Badge>
      </div>

      <LogsFilterCard
        models={state.models}
        values={state.filterValues}
        error={
          error ||
          (modelsQuery.error instanceof Error
            ? modelsQuery.error.message
            : null)
        }
        onValuesChange={state.setFilterValues}
        onApply={state.handleApplyFilters}
        onClear={state.handleClearFilters}
      />

      <LogsTable
        logs={logs}
        loading={loading}
        page={page}
        pageSize={pageSize}
        pagination={pagination}
        visibleColumns={state.visibleColumns}
        autoRefetchEnabled={state.autoRefetchEnabled}
        groupByModel={state.groupByModel}
        refreshing={refreshing}
        onSelectLog={state.setSelectedLog}
        onToggleColumn={state.handleToggleColumn}
        onAutoRefetchChange={state.setAutoRefetchEnabled}
        onGroupByModelChange={state.setGroupByModel}
        onRefetch={() => {
          void refetch();
        }}
        onPageChange={state.handlePageChange}
        onPageSizeChange={state.handlePageSizeChange}
      />

      <LogDetailDialog
        log={state.selectedLog}
        open={state.selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) state.setSelectedLog(null);
        }}
      />
    </>
  );
}
