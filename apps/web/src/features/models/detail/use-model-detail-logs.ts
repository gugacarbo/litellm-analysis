import type {
  PaginationMetadata,
  SpendLog,
} from "@lite-llm/contracts/analytics";
import type { SpendLogsChangedPayload } from "@lite-llm/contracts/ws-events";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpendLogsWs } from "@/shared/hooks/use-spend-logs-ws";
import { getSpendLogs } from "@/shared/lib/api-client/spend";
import { invalidateSpendLogsFromWsEvent } from "@/shared/lib/invalidate-spend-logs-from-ws-event";
import { queryKeys } from "@/shared/lib/query-keys";

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
  const queryClient = useQueryClient();
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

  const logs = (logsQuery.data?.logs ?? []) as SpendLog[];
  const visibleRequestIds = useMemo(
    () => logs.map((log) => log.request_id),
    [logs],
  );
  const visibleRequestIdsRef = useRef(visibleRequestIds);
  visibleRequestIdsRef.current = visibleRequestIds;

  const handleSpendLogsChanged = useCallback(
    (payload: SpendLogsChangedPayload) => {
      invalidateSpendLogsFromWsEvent(queryClient, payload, {
        visibleRequestIds: visibleRequestIdsRef.current,
      });
    },
    [queryClient],
  );

  useSpendLogsWs({
    enabled: modelName.length > 0,
    onSpendLogsChanged: handleSpendLogsChanged,
  });

  const loading = logsQuery.isPending && !logsQuery.data;

  const refetch = useCallback(
    (_options: RefetchOptions = {}) => logsQuery.refetch(),
    [logsQuery],
  );

  return {
    logs,
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
