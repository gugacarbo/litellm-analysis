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

  const handleToggleColumn = (column: ErrorColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(1);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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
