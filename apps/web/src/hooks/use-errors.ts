import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getErrorLogs } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { ErrorLog } from '../types/analytics';

const DEFAULT_ERROR_LOGS_LIMIT = 1000;

type RefetchOptions = {
  background?: boolean;
};

export function useErrors() {
  const errorsQuery = useQuery({
    queryKey: queryKeys.errorLogs(DEFAULT_ERROR_LOGS_LIMIT),
    queryFn: () => getErrorLogs(DEFAULT_ERROR_LOGS_LIMIT),
  });

  const loading = errorsQuery.isPending && !errorsQuery.data;

  const refetch = useCallback(
    (_options: RefetchOptions = {}) => errorsQuery.refetch(),
    [errorsQuery],
  );

  return {
    errors: (errorsQuery.data ?? []) as ErrorLog[],
    loading,
    refreshing: errorsQuery.isFetching && !loading,
    error:
      errorsQuery.error instanceof Error ? errorsQuery.error.message : null,
    refetch,
  };
}
