import { useCallback, useEffect, useState } from 'react';
import { getSpendLogs } from '../lib/api-client';
import type { PaginationMetadata, SpendLog } from '../types/analytics';

export type LogFilters = {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
};

export function useLogs() {
  const [logs, setLogs] = useState<SpendLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    total: 0,
    page: 1,
    page_size: 25,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<LogFilters>({});

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const data = await getSpendLogs({
        model: filters.model,
        user: filters.user,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: pageSize,
        offset,
      });
      setLogs(data.logs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return {
    logs,
    pagination,
    loading,
    error,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch: fetchLogs,
  };
}
