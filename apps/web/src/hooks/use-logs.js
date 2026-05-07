import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSpendLogs } from "../lib/api-client/spend";
import { queryKeys } from "../lib/query-keys";

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  page_size: 25,
  total_pages: 0,
};
export function useLogs() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({});
  const abortRef = useRef(null);
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
      const controller = new AbortController();
      abortRef.current = controller;
      const offset = (page - 1) * pageSize;
      return getSpendLogs(
        {
          model: filters.model,
          user: filters.user,
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: pageSize || undefined,
          offset,
        },
        { signal: controller.signal },
      );
    },
  });
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);
  const loading = logsQuery.isPending && !logsQuery.data;
  const refetch = useCallback(
    (_options = {}) => logsQuery.refetch(),
    [logsQuery],
  );
  return {
    logs: logsQuery.data?.logs ?? [],
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
