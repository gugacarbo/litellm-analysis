import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { APP_LOCALE } from "@/lib/locale";
import { ErrorDetailDialog } from "../components/errors/error-detail-dialog";
import { ErrorsDistributionChart } from "../components/errors/errors-distribution-chart";
import { ErrorsFilterCard } from "../components/errors/errors-filter-card";
import { ErrorsSummaryCards } from "../components/errors/errors-summary-cards";
import {
  DEFAULT_VISIBLE_ERROR_COLUMNS,
  ErrorsTable,
} from "../components/errors/errors-table";
import { Badge } from "../components/ui/badge";
import { useErrors } from "../hooks/use-errors";
import { getAllModels } from "../lib/api-client/models";
import { queryKeys } from "../lib/query-keys";
import { AUTO_REFETCH_INTERVAL_MS, applyErrorFilters } from "./errors-utils";
export function LogsErrorsTab() {
  const { errors, loading, refreshing, error, refetch } = useErrors();
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });
  const models = useMemo(
    () => (modelsQuery.data ?? []).map((config) => config.modelName),
    [modelsQuery.data],
  );
  const [selectedError, setSelectedError] = useState(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(
    DEFAULT_VISIBLE_ERROR_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState({
    model: "",
    user: "",
    startDate: "",
    endDate: "",
  });
  useEffect(() => {
    if (!autoRefetchEnabled) return;
    const interval = window.setInterval(() => {
      void refetch({ background: true });
    }, AUTO_REFETCH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [autoRefetchEnabled, refetch]);
  const filteredErrors = useMemo(
    () => applyErrorFilters(errors, filters),
    [errors, filters],
  );
  const pagination = useMemo(
    () => ({
      total: filteredErrors.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredErrors.length / pageSize),
    }),
    [filteredErrors.length, page, pageSize],
  );
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredErrors.length / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredErrors.length, page, pageSize]);
  const paginatedErrors = useMemo(() => {
    const offset = (page - 1) * pageSize;
    return filteredErrors.slice(offset, offset + pageSize);
  }, [filteredErrors, page, pageSize]);
  const totals = useMemo(() => {
    return {
      total: filteredErrors.length,
      serverErrors: filteredErrors.filter((entry) => entry.status_code >= 500)
        .length,
      clientErrors: filteredErrors.filter(
        (entry) => entry.status_code >= 400 && entry.status_code < 500,
      ).length,
      uniqueModels: new Set(filteredErrors.map((entry) => entry.model)).size,
      totalSpendOnErrors: filteredErrors.reduce(
        (sum, entry) => sum + (entry.spend ?? 0),
        0,
      ),
      totalTokensBeforeErrors: filteredErrors.reduce(
        (sum, entry) => sum + (entry.total_tokens ?? 0),
        0,
      ),
    };
  }, [filteredErrors]);
  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );
  const handleApplyFilters = () => {
    setFilters({
      model: filterValues.model,
      user: filterValues.user,
      startDate: filterValues.startDate,
      endDate: filterValues.endDate,
    });
  };
  const handleClearFilters = () => {
    setFilters({});
    setFilterValues({
      model: "",
      user: "",
      startDate: "",
      endDate: "",
    });
  };
  const handleToggleColumn = (column) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setPage(1);
  };
  return _jsxs(_Fragment, {
    children: [
      _jsxs("div", {
        className: "space-y-4",
        children: [
          _jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: [
              _jsxs(Badge, {
                variant: "outline",
                children: [
                  pagination.total.toLocaleString(APP_LOCALE),
                  " errors",
                ],
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
          _jsx(ErrorsFilterCard, {
            models: models,
            values: filterValues,
            error:
              error ||
              (modelsQuery.error instanceof Error
                ? modelsQuery.error.message
                : null),
            onValuesChange: setFilterValues,
            onApply: handleApplyFilters,
            onClear: handleClearFilters,
          }),
          _jsx(ErrorsSummaryCards, { loading: loading, totals: totals }),
          _jsx(ErrorsDistributionChart, {
            errors: filteredErrors,
            loading: loading,
          }),
          _jsx(ErrorsTable, {
            errors: paginatedErrors,
            loading: loading,
            refreshing: refreshing,
            page: page,
            pageSize: pageSize,
            pagination: pagination,
            visibleColumns: visibleColumns,
            autoRefetchEnabled: autoRefetchEnabled,
            onSelectError: setSelectedError,
            onToggleColumn: handleToggleColumn,
            onAutoRefetchChange: setAutoRefetchEnabled,
            onRefetch: () => {
              void refetch({ background: true });
            },
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }),
        ],
      }),
      _jsx(ErrorDetailDialog, {
        errorLog: selectedError,
        open: selectedError !== null,
        onOpenChange: (open) => {
          if (!open) setSelectedError(null);
        },
      }),
    ],
  });
}
