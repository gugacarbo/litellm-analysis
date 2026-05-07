import { useQuery } from "@tanstack/react-query";
import { Calendar, Filter, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { getSpendLogs } from "../../lib/api-client/spend";
import { queryKeys } from "../../lib/query-keys";
import { LogDetailDialog } from "../logs/log-detail-dialog";
import { LogsSummaryCards } from "../logs/logs-summary-cards";
import { DEFAULT_VISIBLE_LOG_COLUMNS, LogsTable } from "../logs/logs-table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const DEFAULT_PAGE_SIZE = 25;
const AUTO_REFETCH_MS = 15_000;
const EMPTY_PAGINATION = {
  total: 0,
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total_pages: 0,
};
function toLocalDateString(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString(APP_LOCALE, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: APP_TIMEZONE,
    })
    .split("/")
    .reverse()
    .join("-");
}
function normalizeDateInput(value) {
  if (!value) return "";
  return toLocalDateString(value);
}
export function ModelDetailLogsPanel({
  modelName,
  defaultStartDate,
  defaultEndDate,
}) {
  const initialFilters = useMemo(
    () => ({
      user: "",
      startDate: normalizeDateInput(defaultStartDate),
      endDate: normalizeDateInput(defaultEndDate),
    }),
    [defaultStartDate, defaultEndDate],
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedLog, setSelectedLog] = useState(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(true);
  const [groupByModel, setGroupByModel] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );
  const previousModelRef = useRef(modelName);
  useEffect(() => {
    const modelChanged = previousModelRef.current !== modelName;
    if (modelChanged) {
      const resetFilters = {
        user: "",
        startDate: initialFilters.startDate,
        endDate: initialFilters.endDate,
      };
      setDraftFilters(resetFilters);
      setFilters(resetFilters);
      setSelectedLog(null);
      setPage(1);
      previousModelRef.current = modelName;
      return;
    }
    setDraftFilters((current) => ({
      ...current,
      startDate: initialFilters.startDate,
      endDate: initialFilters.endDate,
    }));
    setFilters((current) => ({
      ...current,
      startDate: initialFilters.startDate,
      endDate: initialFilters.endDate,
    }));
    setPage(1);
  }, [modelName, initialFilters.endDate, initialFilters.startDate]);
  const activeFiltersCount = [
    filters.user,
    filters.startDate,
    filters.endDate,
  ].filter((value) => value.length > 0).length;
  const logsQuery = useQuery({
    queryKey: queryKeys.spendLogs({
      page,
      pageSize,
      model: modelName,
      user: filters.user || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
    queryFn: () => {
      const offset = (page - 1) * pageSize;
      return getSpendLogs({
        model: modelName,
        user: filters.user || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: pageSize,
        offset,
      });
    },
    refetchInterval: autoRefetchEnabled ? AUTO_REFETCH_MS : false,
    enabled: modelName.length > 0,
  });
  const logs = logsQuery.data?.logs ?? [];
  const pagination = logsQuery.data?.pagination ?? EMPTY_PAGINATION;
  const loading = logsQuery.isPending && !logsQuery.data;
  const refreshing = logsQuery.isFetching && !loading;
  const error = logsQuery.error instanceof Error ? logsQuery.error.message : "";
  const handleToggleColumn = (column) => {
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        if (currentColumns.length === 1) return currentColumns;
        return currentColumns.filter((key) => key !== column);
      }
      return [...currentColumns, column];
    });
  };
  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };
  const handleClearFilters = () => {
    const cleared = {
      user: "",
      startDate: initialFilters.startDate,
      endDate: initialFilters.endDate,
    };
    setDraftFilters(cleared);
    setFilters(cleared);
    setPage(1);
  };
  const handlePageSizeChange = (value) => {
    const nextSize = Number(value);
    if (Number.isNaN(nextSize)) return;
    setPageSize(nextSize);
    setPage(1);
  };
  const handlePageChange = (nextPage) => {
    const totalPages = pagination.total_pages || 1;
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };
  return _jsxs("div", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "flex flex-wrap items-center gap-2",
        children: [
          _jsxs(Badge, {
            variant: "outline",
            children: ["Model: ", modelName],
          }),
          _jsxs(Badge, {
            variant: "outline",
            children: [pagination.total.toLocaleString(APP_LOCALE), " logs"],
          }),
          _jsx(Badge, {
            variant: "outline",
            children:
              activeFiltersCount > 0
                ? `${activeFiltersCount} active filters`
                : "No active filters",
          }),
        ],
      }),
      _jsx(LogsSummaryCards, { logs: logs, loading: loading }),
      _jsx(Card, {
        children: _jsxs(CardContent, {
          className: "space-y-4",
          children: [
            _jsxs("div", {
              className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
              children: [
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsxs(Label, {
                      htmlFor: "model-detail-logs-user-filter",
                      className: "inline-flex items-center gap-1",
                      children: [
                        _jsx(User, { className: "h-3.5 w-3.5" }),
                        "User",
                      ],
                    }),
                    _jsx(Input, {
                      id: "model-detail-logs-user-filter",
                      placeholder: "user id",
                      value: draftFilters.user,
                      onChange: (event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          user: event.target.value,
                        })),
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsxs(Label, {
                      htmlFor: "model-detail-logs-start-date",
                      className: "inline-flex items-center gap-1",
                      children: [
                        _jsx(Calendar, { className: "h-3.5 w-3.5" }),
                        "Start date",
                      ],
                    }),
                    _jsx(Input, {
                      id: "model-detail-logs-start-date",
                      type: "date",
                      value: draftFilters.startDate,
                      onChange: (event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          startDate: event.target.value,
                        })),
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsxs(Label, {
                      htmlFor: "model-detail-logs-end-date",
                      className: "inline-flex items-center gap-1",
                      children: [
                        _jsx(Calendar, { className: "h-3.5 w-3.5" }),
                        "End date",
                      ],
                    }),
                    _jsx(Input, {
                      id: "model-detail-logs-end-date",
                      type: "date",
                      value: draftFilters.endDate,
                      onChange: (event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          endDate: event.target.value,
                        })),
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-end gap-2",
                  children: [
                    _jsxs(Button, {
                      className: "flex-1",
                      onClick: handleApplyFilters,
                      children: [
                        _jsx(Filter, { className: "h-4 w-4" }),
                        "Apply",
                      ],
                    }),
                    _jsx(Button, {
                      variant: "outline",
                      className: "flex-1",
                      onClick: handleClearFilters,
                      children: "Clear",
                    }),
                  ],
                }),
              ],
            }),
            error
              ? _jsx("div", {
                  className:
                    "rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                  children: error,
                })
              : null,
          ],
        }),
      }),
      _jsx(LogsTable, {
        logs: logs,
        loading: loading,
        refreshing: refreshing,
        page: page,
        pageSize: pageSize,
        pagination: pagination,
        visibleColumns: visibleColumns,
        autoRefetchEnabled: autoRefetchEnabled,
        groupByModel: groupByModel,
        onSelectLog: setSelectedLog,
        onToggleColumn: handleToggleColumn,
        onAutoRefetchChange: setAutoRefetchEnabled,
        onGroupByModelChange: setGroupByModel,
        onRefetch: () => {
          void logsQuery.refetch();
        },
        onPageChange: handlePageChange,
        onPageSizeChange: handlePageSizeChange,
      }),
      _jsx(LogDetailDialog, {
        log: selectedLog,
        open: selectedLog !== null,
        onOpenChange: (open) => {
          if (!open) setSelectedLog(null);
        },
      }),
    ],
  });
}
