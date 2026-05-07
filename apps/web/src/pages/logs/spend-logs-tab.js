import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE } from "@/lib/locale";
import { LogDetailDialog } from "../../components/logs/log-detail-dialog";
import { LogsFilterCard } from "../../components/logs/logs-filter-card";
import { LogsSummaryCards } from "../../components/logs/logs-summary-cards";
import { LogsTable } from "../../components/logs/logs-table";
import { Badge } from "../../components/ui/badge";
import { useSpendLogsState } from "./spend-logs-state";
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
}) {
  const state = useSpendLogsState({
    filters,
    pagination,
    modelsQuery,
    setPage,
    setPageSize,
    setFilters,
    refetch,
  });
  return _jsxs("div", {
    className: "space-y-3",
    children: [
      _jsxs("div", {
        className: "flex flex-wrap items-center gap-2",
        children: [
          _jsxs(Badge, {
            variant: "outline",
            children: [pagination.total.toLocaleString(APP_LOCALE), " logs"],
          }),
          _jsx(Badge, {
            variant: "outline",
            children:
              state.activeFiltersCount > 0
                ? `${state.activeFiltersCount} active filters`
                : "No active filters",
          }),
        ],
      }),
      _jsx(LogsSummaryCards, { logs: logs, loading: loading }),
      _jsx(LogsFilterCard, {
        models: state.models,
        values: state.filterValues,
        error:
          error ||
          (modelsQuery.error instanceof Error
            ? modelsQuery.error.message
            : null),
        onValuesChange: state.setFilterValues,
        onApply: state.handleApplyFilters,
        onClear: state.handleClearFilters,
      }),
      _jsx(LogsTable, {
        logs: logs,
        loading: loading,
        page: page,
        pageSize: pageSize,
        pagination: pagination,
        visibleColumns: state.visibleColumns,
        autoRefetchEnabled: state.autoRefetchEnabled,
        groupByModel: state.groupByModel,
        refreshing: refreshing,
        onSelectLog: state.setSelectedLog,
        onToggleColumn: state.handleToggleColumn,
        onAutoRefetchChange: state.setAutoRefetchEnabled,
        onGroupByModelChange: state.setGroupByModel,
        onRefetch: () => {
          void refetch();
        },
        onPageChange: state.handlePageChange,
        onPageSizeChange: state.handlePageSizeChange,
      }),
      _jsx(LogDetailDialog, {
        log: state.selectedLog,
        open: state.selectedLog !== null,
        onOpenChange: (open) => {
          if (!open) state.setSelectedLog(null);
        },
      }),
    ],
  });
}
