import type {
  PaginationMetadata,
  SpendLog,
} from "@lite-llm/api-contracts/analytics";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSpendLogs } from "@/lib/api-client/spend";
import { queryKeys } from "@/lib/query-keys";

type RefetchOptions = {
  background?: boolean;
};

const DEFAULT_PAGINATION: PaginationMetadata = {
  total: 0,
  page: 1,
  page_size: 25,
  total_pages: 0,
};

export function useModelDetailLogs(modelName: string) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const abortRef = useRef<AbortController | null>(null);

  const logsQuery = useQuery({
    queryKey: queryKeys.spendLogs({
      page,
      pageSize,
      model: modelName,
    }),
    queryFn: () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const offset = (page - 1) * pageSize;
      return getSpendLogs(
        {
          model: modelName,
          limit: pageSize || undefined,
          offset,
        },
        { signal: controller.signal },
      );
    },
    enabled: modelName.length > 0,
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
    setPage,
    setPageSize,
    refetch,
  };
}
