import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../components/card";
import { DeleteModelLogsDialog } from "../components/model-stats/delete-model-logs-dialog";
import { MergeModelLogsDialog } from "../components/model-stats/merge-model-logs-dialog";
import { ModelStatsDataTable } from "../components/model-stats/model-stats-data-table";
import { ModelStatsHeader } from "../components/model-stats/model-stats-header";
import { ModelStatsMergePanel } from "../components/model-stats/model-stats-merge-panel";
import { ModelStatsSummaryCards } from "../components/model-stats/model-stats-summary-cards";
import { ModelStatsTopTables } from "../components/model-stats/model-stats-top-tables";
import { Toaster } from "../components/sonner";
import { getModelStatistics } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useModelStatsDialogHandlers } from "./model-stats/dialog-handlers";
import { useModelStatsDialogState } from "./model-stats/dialog-state";
import { MODEL_STATS_COLUMNS } from "./model-stats/model-stats-types";
import { useModelStatsMutations } from "./model-stats/mutations";

export function ModelStatsPage() {
  const queryClient = useQueryClient();
  const state = useModelStatsDialogState();
  const mutations = useModelStatsMutations();
  const {
    handleSort,
    toggleColumn,
    openDeleteDialog,
    handleDelete,
    handleMerge,
    confirmMerge,
  } = useModelStatsDialogHandlers(queryClient, state, mutations);

  const modelStatsQuery = useQuery({
    queryKey: queryKeys.modelStatistics(state.rangeDays),
    queryFn: () => getModelStatistics(state.rangeDays),
    refetchInterval: 30_000,
  });

  const data = modelStatsQuery.data ?? [];
  const loading = modelStatsQuery.isPending && !modelStatsQuery.data;
  const error =
    modelStatsQuery.error instanceof Error
      ? modelStatsQuery.error.message
      : null;

  const filteredData = data.filter((m) => {
    const modelName = m.model ?? "";
    return modelName.toLowerCase().includes(state.searchQuery.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[state.sortField];
    const bVal = b[state.sortField];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return state.sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return state.sortDirection === "asc"
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

  const avgTokensPerSecond =
    totalTokens > 0
      ? data.reduce(
          (sum, m) =>
            sum +
            Number(m.avg_tokens_per_second || 0) * Number(m.request_count),
          0,
        ) / totalRequests
      : 0;

  const maxTokensPerSecond = Math.max(
    ...data.map((m) => Number(m.max_tokens_per_second || 0)),
    0,
  );

  const totalErrors = data.reduce(
    (sum, m) => sum + Number(m.error_count || 0),
    0,
  );

  const avgLatency =
    totalRequests > 0
      ? data.reduce(
          (sum, m) =>
            sum + Number(m.avg_latency_ms || 0) * Number(m.request_count),
          0,
        ) / totalRequests
      : 0;

  const avgCostPerRequest = totalRequests > 0 ? totalSpend / totalRequests : 0;
  const uniqueModels = data.length;

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
        open={state.deleteDialogOpen}
        deleting={state.deleting}
        onOpenChange={state.setDeleteDialogOpen}
        onCancel={() => state.setDeleting(null)}
        onConfirm={handleDelete}
      />

      <MergeModelLogsDialog
        open={state.mergeDialogOpen}
        sourceModel={state.sourceModel}
        targetModel={state.targetModel}
        sourceModelCount={
          data.find((m) => m.model === state.sourceModel)?.request_count || 0
        }
        onOpenChange={state.setMergeDialogOpen}
        onConfirm={confirmMerge}
      />

      <ModelStatsHeader
        mergeMode={state.mergeMode}
        columns={MODEL_STATS_COLUMNS}
        visibleColumns={state.visibleColumns}
        searchQuery={state.searchQuery}
        onToggleMergeMode={() => state.setMergeMode((prev) => !prev)}
        onToggleColumn={toggleColumn}
        onSearchChange={state.setSearchQuery}
        selectedDateRange={state.selectedDateRange}
        setSelectedDateRange={state.setSelectedDateRange}
      />

      {state.mergeMode && (
        <ModelStatsMergePanel
          data={data}
          sourceModel={state.sourceModel}
          targetModel={state.targetModel}
          merging={state.merging}
          onSourceModelChange={state.setSourceModel}
          onTargetModelChange={state.setTargetModel}
          onMerge={handleMerge}
        />
      )}

      <ModelStatsSummaryCards
        loading={loading}
        totalSpend={totalSpend}
        totalRequests={totalRequests}
        totalTokens={totalTokens}
        avgSuccessRate={avgSuccessRate}
        totalErrors={totalErrors}
        avgLatency={avgLatency}
        avgCostPerRequest={avgCostPerRequest}
        uniqueModels={uniqueModels}
        rangeLabel={
          state.rangeDays === 1
            ? "today"
            : state.rangeDays === 7
              ? "7 days"
              : `${state.rangeDays} days`
        }
        avgTokensPerSecond={avgTokensPerSecond}
        maxTokensPerSecond={maxTokensPerSecond}
      />

      <ModelStatsDataTable
        loading={loading}
        data={sortedData}
        columns={MODEL_STATS_COLUMNS}
        visibleColumns={state.visibleColumns}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        totalSpend={totalSpend}
        deleting={state.deleting}
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
