import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getSpendLogs } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { PaginationMetadata, SpendLog } from "../types/analytics";

export type LogFilters = {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
};

type RefetchOptions = {
  background?: boolean;
};

const DEFAULT_PAGINATION: PaginationMetadata = {
  total: 0,
  page: 1,
  page_size: 25,
  total_pages: 0,
};

export function useLogs() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<LogFilters>({});

  const logsQuery = useQuery({
    queryKey: queryKeys.spendLogs({
      page,
      pageSize,
      model: filters.model,
      user: filters.user,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    queryFn: () => {
      const offset = (page - 1) * pageSize;
      return getSpendLogs({
        model: filters.model,
        user: filters.user,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: pageSize,
        offset,
      });
    },
  });

  const loading = logsQuery.isPending && !logsQuery.data;

  const refetch = useCallback(
    (_options: RefetchOptions = {}) => logsQuery.refetch(),
    [logsQuery],
  );

  return {
    logs: (logsQuery.data?.logs ?? []) as SpendLog[],
    pagination: logsQuery.data?.pagination ?? DEFAULT_PAGINATION,
    loading,
    refreshing: logsQuery.isFetching && !loading,
    error: logsQuery.error instanceof Error ? logsQuery.error.message : null,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch,
  };
}
