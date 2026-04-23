import { useEffect, useState } from 'react';
import { Badge } from '../components/badge';
import { FeatureGate } from '../components/feature-gate';
import { LogDetailDialog } from '../components/logs/log-detail-dialog';
import {
  LogsFilterCard,
  type LogsFilterValues,
} from '../components/logs/logs-filter-card';
import { LogsTable } from '../components/logs/logs-table';
import { UnavailableFeature } from '../components/unavailable-feature';
import { useLogs } from '../hooks/use-logs';
import { useServerMode } from '../hooks/use-server-mode';
import { getAllModels } from '../lib/api-client';
import type { SpendLog } from '../types/analytics';

export function LogsPage() {
  const {
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
  } = useLogs();
  const { mode } = useServerMode();

  const [models, setModels] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<SpendLog | null>(null);
  const [filterValues, setFilterValues] = useState<LogsFilterValues>({
    model: filters.model || '',
    user: filters.user || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  });

  useEffect(() => {
    async function fetchModels() {
      try {
        const modelConfigs = await getAllModels();
        setModels(modelConfigs.map((config) => config.modelName));
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    }

    fetchModels();
  }, []);

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
      model: '',
      user: '',
      startDate: '',
      endDate: '',
    });
    setFilters({});
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setPage(1);
  };

  return (
    <FeatureGate
      capability="spendLogs"
      fallback={<UnavailableFeature capability="spendLogs" />}
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Spend Logs</h1>
          <Badge
            variant={mode === 'database' ? 'default' : 'secondary'}
            className="bg-green-100 text-green-800"
          >
            {mode === 'database' ? 'Database Mode' : 'API-Only Mode'}
          </Badge>
        </div>

        <LogsFilterCard
          models={models}
          values={filterValues}
          error={error}
          onValuesChange={setFilterValues}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <LogsTable
          logs={logs}
          loading={loading}
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          onSelectLog={setSelectedLog}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <LogDetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </FeatureGate>
  );
}
