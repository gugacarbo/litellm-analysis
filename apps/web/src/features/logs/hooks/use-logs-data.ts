import type {
  PaginationMetadata,
  SpendLog,
} from "@lite-llm/contracts/analytics";
import type { SpendLogsChangedPayload } from "@lite-llm/contracts/ws-events";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFilter } from "@/shared/contexts/filter-context";
import { useSpendLogsWs } from "@/shared/hooks/use-spend-logs-ws";
import { getSpendLogs } from "@/shared/lib/api-client/spend";
import { invalidateSpendLogsFromWsEvent } from "@/shared/lib/invalidate-spend-logs-from-ws-event";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  DEFAULT_VISIBLE_LOG_COLUMNS,
  type LogColumnKey,
} from "../components/logs-table-columns";

type RefetchOptions = {
  background?: boolean;
};

const DEFAULT_PAGINATION: PaginationMetadata = {
  total: 0,
  page: 1,
  page_size: 25,
  total_pages: 0,
};

export function useLogsData() {
  const queryClient = useQueryClient();
  const { dateRange, customFrom, customTo, rangeDays } = useFilter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<LogColumnKey[]>(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(false);
  const [groupByModel, setGroupByModel] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const queryParams = useMemo(() => {
    if (dateRange === "custom" && customFrom && customTo) {
      return {
        startDate: customFrom.toISOString(),
        endDate: customTo.toISOString(),
      };
    }
    return { days: rangeDays };
  }, [dateRange, customFrom, customTo, rangeDays]);

  const logsQuery = useQuery({
    queryKey: queryKeys.spendLogs({
      page,
      pageSize,
      ...(queryParams.startDate ? { startDate: queryParams.startDate } : {}),
      ...(queryParams.endDate ? { endDate: queryParams.endDate } : {}),
    }),
    queryFn: () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const offset = (page - 1) * pageSize;
      return getSpendLogs(
        {
          limit: pageSize || undefined,
          offset,
          ...(queryParams.startDate
            ? { startDate: queryParams.startDate }
            : {}),
          ...(queryParams.endDate ? { endDate: queryParams.endDate } : {}),
        },
        { signal: controller.signal },
      );
    },
    refetchInterval: autoRefetchEnabled ? 5000 : false,
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setPage(1);
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
    onSpendLogsChanged: handleSpendLogsChanged,
  });

  const loading = logsQuery.isPending && !logsQuery.data;
  const refreshing = logsQuery.isFetching && !loading;

  const refetch = useCallback(
    (_options: RefetchOptions = {}) => logsQuery.refetch(),
    [logsQuery],
  );

  const toggleColumn = useCallback((column: LogColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  }, []);

  return {
    logs,
    pagination: logsQuery.data?.pagination ?? DEFAULT_PAGINATION,
    loading,
    refreshing,
    error: logsQuery.error instanceof Error ? logsQuery.error.message : null,
    page,
    pageSize,
    setPage,
    setPageSize,
    visibleColumns,
    toggleColumn,
    autoRefetchEnabled,
    setAutoRefetchEnabled,
    groupByModel,
    setGroupByModel,
    refetch,
  };
}
