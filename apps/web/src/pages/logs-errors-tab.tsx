import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ErrorColumnKey } from "@/components/errors/errors-table-columns";
import { Badge } from "../components/badge";
import { ErrorDetailDialog } from "../components/errors/error-detail-dialog";
import {
  ErrorsFilterCard,
  type ErrorsFilterValues,
} from "../components/errors/errors-filter-card";
import { ErrorsSummaryCards } from "../components/errors/errors-summary-cards";
import {
  DEFAULT_VISIBLE_ERROR_COLUMNS,
  ErrorsTable,
} from "../components/errors/errors-table";
import { useErrors } from "../hooks/use-errors";
import { useServerMode } from "../hooks/use-server-mode";
import { getAllModels } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { ErrorLog, PaginationMetadata } from "../types/analytics";
import {
  AUTO_REFETCH_INTERVAL_MS,
  applyErrorFilters,
  type ErrorFilters,
} from "./errors-utils";

export function LogsErrorsTab() {
  const { errors, loading, refreshing, error, refetch } = useErrors();
  const { mode } = useServerMode();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const models = useMemo(
    () => (modelsQuery.data ?? []).map((config) => config.modelName),
    [modelsQuery.data],
  );

  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ErrorFilters>({});
  const [visibleColumns, setVisibleColumns] = useState<ErrorColumnKey[]>(
    DEFAULT_VISIBLE_ERROR_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<ErrorsFilterValues>({
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

  const pagination = useMemo<PaginationMetadata>(
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
    };
  }, [filteredErrors]);

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const modeLabel =
    mode === "database"
      ? "Database Mode"
      : mode === "api-only"
        ? "API-Only Mode"
        : "Limited Mode";

  const modeBadgeClass =
    mode === "database"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : mode === "limited"
        ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
        : "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";

  const handleApplyFilters = () => {
    setFilters({
      model: filterValues.model || undefined,
      user: filterValues.user || undefined,
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilterValues({
      model: "",
      user: "",
      startDate: "",
      endDate: "",
    });
    setFilters({});
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = pagination.total_pages || 1;
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const parsedPageSize = Number(newPageSize);
    if (Number.isNaN(parsedPageSize)) return;

    setPageSize(parsedPageSize);
    setPage(1);
  };

  const handleToggleColumn = (column: ErrorColumnKey) => {
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        if (currentColumns.length === 1) return currentColumns;
        return currentColumns.filter((key) => key !== column);
      }
      return [...currentColumns, column];
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={modeBadgeClass}>
            {modeLabel}
          </Badge>
          <Badge variant="outline">
            {pagination.total.toLocaleString("en-US")} errors
          </Badge>
          <Badge variant="outline">
            {activeFiltersCount > 0
              ? `${activeFiltersCount} active filters`
              : "No active filters"}
          </Badge>
        </div>

        <ErrorsFilterCard
          models={models}
          values={filterValues}
          error={
            error ||
            (modelsQuery.error instanceof Error
              ? modelsQuery.error.message
              : null)
          }
          onValuesChange={setFilterValues}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <ErrorsSummaryCards loading={loading} totals={totals} />

        <ErrorsTable
          errors={paginatedErrors}
          loading={loading}
          refreshing={refreshing}
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          visibleColumns={visibleColumns}
          autoRefetchEnabled={autoRefetchEnabled}
          onSelectError={setSelectedError}
          onToggleColumn={handleToggleColumn}
          onAutoRefetchChange={setAutoRefetchEnabled}
          onRefetch={() => {
            void refetch({ background: true });
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <ErrorDetailDialog
        errorLog={selectedError}
        open={selectedError !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedError(null);
        }}
      />
    </>
  );
}
