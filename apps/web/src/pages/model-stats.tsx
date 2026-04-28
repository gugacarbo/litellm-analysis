import { Card, CardContent } from "../components/card";
import { DeleteModelLogsDialog } from "../components/model-stats/delete-model-logs-dialog";
import { MergeModelLogsDialog } from "../components/model-stats/merge-model-logs-dialog";
import { ModelStatsCharts } from "../components/model-stats/model-stats-charts";
import { ModelStatsDataTable } from "../components/model-stats/model-stats-data-table";
import { ModelStatsHeader } from "../components/model-stats/model-stats-header";
import { ModelStatsMergePanel } from "../components/model-stats/model-stats-merge-panel";
import { ModelStatsSummaryCards } from "../components/model-stats/model-stats-summary-cards";
import { ModelStatsTopTables } from "../components/model-stats/model-stats-top-tables";
import { Toaster } from "../components/sonner";
import { MODEL_STATS_COLUMNS } from "./model-stats/model-stats-types";
import { useModelStatsPageState } from "./model-stats/use-model-stats-page";

export function ModelStatsPage() {
  const state = useModelStatsPageState();

  if (state.error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error: {state.error}</p>
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
        onConfirm={state.handleDelete}
      />

      <MergeModelLogsDialog
        open={state.mergeDialogOpen}
        sourceModel={state.sourceModel}
        targetModel={state.targetModel}
        sourceModelCount={
          state.data.find((m) => m.model === state.sourceModel)
            ?.request_count || 0
        }
        onOpenChange={state.setMergeDialogOpen}
        onConfirm={state.confirmMerge}
      />

      <ModelStatsHeader
        mergeMode={state.mergeMode}
        columns={MODEL_STATS_COLUMNS}
        visibleColumns={state.visibleColumns}
        searchQuery={state.searchQuery}
        onToggleMergeMode={() => state.setMergeMode((prev) => !prev)}
        onToggleColumn={state.toggleColumn}
        onSearchChange={state.setSearchQuery}
        selectedDateRange={state.selectedDateRange}
        setSelectedDateRange={state.setSelectedDateRange}
      />

      {state.mergeMode && (
        <ModelStatsMergePanel
          data={state.data}
          sourceModel={state.sourceModel}
          targetModel={state.targetModel}
          merging={state.merging}
          onSourceModelChange={state.setSourceModel}
          onTargetModelChange={state.setTargetModel}
          onMerge={state.handleMerge}
        />
      )}

      <ModelStatsSummaryCards
        loading={state.loading}
        totalSpend={state.totalSpend}
        totalRequests={state.totalRequests}
        totalTokens={state.totalTokens}
        avgSuccessRate={state.avgSuccessRate}
      />

      <ModelStatsDataTable
        loading={state.loading}
        data={state.sortedData}
        columns={MODEL_STATS_COLUMNS}
        visibleColumns={state.visibleColumns}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        totalSpend={state.totalSpend}
        deleting={state.deleting}
        onSort={state.handleSort}
        onDeleteClick={state.openDeleteDialog}
      />

      <ModelStatsCharts
        loading={state.loading}
        tokenDistribution={state.tokenDistribution}
        modelDistribution={state.modelDistribution}
        costEfficiency={state.costEfficiency}
      />

      <ModelStatsTopTables
        data={state.data}
        loading={state.loading}
        totalSpend={state.totalSpend}
        totalRequests={state.totalRequests}
      />
    </div>
  );
}

export default ModelStatsPage;
