import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { getErrorLogs } from "../lib/api-client/analytics";
import { queryKeys } from "../lib/query-keys";

const DEFAULT_ERROR_LOGS_LIMIT = 1000;
export function useErrors() {
  const abortRef = useRef(null);
  const errorsQuery = useQuery({
    queryKey: queryKeys.errorLogs(DEFAULT_ERROR_LOGS_LIMIT),
    queryFn: () => {
      const controller = new AbortController();
      abortRef.current = controller;
      return getErrorLogs(DEFAULT_ERROR_LOGS_LIMIT, undefined, {
        signal: controller.signal,
      });
    },
  });
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);
  const loading = errorsQuery.isPending && !errorsQuery.data;
  const refetch = useCallback(
    (_options = {}) => errorsQuery.refetch(),
    [errorsQuery],
  );
  return {
    errors: errorsQuery.data ?? [],
    loading,
    refreshing: errorsQuery.isFetching && !loading,
    error:
      errorsQuery.error instanceof Error ? errorsQuery.error.message : null,
    refetch,
  };
}
