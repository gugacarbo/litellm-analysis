import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/card';
import { FeatureGate } from '../components/feature-gate';
import { DeleteModelLogsDialog } from '../components/model-stats/delete-model-logs-dialog';
import { MergeModelLogsDialog } from '../components/model-stats/merge-model-logs-dialog';
import { ModelStatsDataTable } from '../components/model-stats/model-stats-data-table';
import { ModelStatsHeader } from '../components/model-stats/model-stats-header';
import { ModelStatsMergePanel } from '../components/model-stats/model-stats-merge-panel';
import { ModelStatsSummaryCards } from '../components/model-stats/model-stats-summary-cards';
import { ModelStatsTopTables } from '../components/model-stats/model-stats-top-tables';
import { Toaster } from '../components/sonner';
import {
  deleteModelLogs,
  getModelStatistics,
  mergeModels,
} from '../lib/api-client';
import {
  type ColumnKey,
  MODEL_STATS_COLUMNS,
  type ModelStats,
  type SortDirection,
  type SortField,
} from './model-stats/model-stats-types';

export function ModelStatsPage() {
  const isUndefinedModel = (value: string | null | undefined): boolean =>
    !value || value.trim() === '';

  const [data, setData] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('total_spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() =>
    MODEL_STATS_COLUMNS.filter((c) => c.default).map((c) => c.key),
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [sourceModel, setSourceModel] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getModelStatistics();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
      return;
    }

    setSortField(field);
    setSortDirection(field === 'model' ? 'asc' : 'desc');
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const openDeleteDialog = (modelName: string) => {
    setDeleting(modelName);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    const modelName = deleting;
    if (modelName === null) return;
    const modelLabel = modelName.trim() ? modelName : '(no model)';

    setDeleteDialogOpen(false);
    setDeleting(modelName);

    try {
      await deleteModelLogs(modelName);
      setData(
        data.filter((m) =>
          modelName.trim() === ''
            ? !isUndefinedModel(m.model)
            : m.model !== modelName,
        ),
      );
      toast.success(`Deleted logs for model "${modelLabel}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleMerge = async () => {
    if (!sourceModel || !targetModel) {
      toast.warning('Please select both source and target models');
      return;
    }
    if (sourceModel === targetModel) {
      toast.warning('Source and target models must be different');
      return;
    }

    setMergeDialogOpen(true);
  };

  const confirmMerge = async () => {
    setMergeDialogOpen(false);
    setMerging(true);

    try {
      await mergeModels(sourceModel, targetModel);
      const result = await getModelStatistics();
      setData(result);
      setMergeMode(false);
      setSourceModel('');
      setTargetModel('');
      toast.success(`Merged logs from "${sourceModel}" into "${targetModel}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to merge');
    } finally {
      setMerging(false);
    }
  };

  const filteredData = data.filter((m) => {
    const modelName = m.model ?? '';
    return modelName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc'
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  const totalSpend = data.reduce((sum, m) => sum + Number(m.total_spend), 0);
  const totalRequests = data.reduce(
    (sum, m) => sum + Number(m.request_count),
    0,
  );
  const totalTokens = data.reduce((sum, m) => sum + Number(m.total_tokens), 0);
  const avgSuccessRate =
    totalRequests > 0
      ? data.reduce(
          (sum, m) => sum + Number(m.success_rate) * Number(m.request_count),
          0,
        ) / totalRequests
      : 0;

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="bottom-right" />

      <DeleteModelLogsDialog
        open={deleteDialogOpen}
        deleting={deleting}
        onOpenChange={setDeleteDialogOpen}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <MergeModelLogsDialog
        open={mergeDialogOpen}
        sourceModel={sourceModel}
        targetModel={targetModel}
        sourceModelCount={
          data.find((m) => m.model === sourceModel)?.request_count || 0
        }
        onOpenChange={setMergeDialogOpen}
        onConfirm={confirmMerge}
      />

      <ModelStatsHeader
        mergeMode={mergeMode}
        columns={MODEL_STATS_COLUMNS}
        visibleColumns={visibleColumns}
        searchQuery={searchQuery}
        onToggleMergeMode={() => setMergeMode((prev) => !prev)}
        onToggleColumn={toggleColumn}
        onSearchChange={setSearchQuery}
      />

      <FeatureGate capability="mergeModels">
        {mergeMode && (
          <ModelStatsMergePanel
            data={data}
            sourceModel={sourceModel}
            targetModel={targetModel}
            merging={merging}
            onSourceModelChange={setSourceModel}
            onTargetModelChange={setTargetModel}
            onMerge={handleMerge}
          />
        )}
      </FeatureGate>

      <ModelStatsSummaryCards
        loading={loading}
        totalSpend={totalSpend}
        totalRequests={totalRequests}
        totalTokens={totalTokens}
        avgSuccessRate={avgSuccessRate}
      />

      <ModelStatsDataTable
        loading={loading}
        data={sortedData}
        columns={MODEL_STATS_COLUMNS}
        visibleColumns={visibleColumns}
        sortField={sortField}
        sortDirection={sortDirection}
        totalSpend={totalSpend}
        deleting={deleting}
        onSort={handleSort}
        onDeleteClick={openDeleteDialog}
      />

      <ModelStatsTopTables
        data={data}
        loading={loading}
        totalSpend={totalSpend}
        totalRequests={totalRequests}
      />
    </div>
  );
}

export default ModelStatsPage;
