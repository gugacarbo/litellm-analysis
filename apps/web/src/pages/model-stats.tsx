import { BarChart3 } from "lucide-react";
import { DeleteModelLogsDialog } from "../components/model-stats/delete-model-logs-dialog";
import { MergeModelLogsDialog } from "../components/model-stats/merge-model-logs-dialog";
import { ModelStatsDataTable } from "../components/model-stats/model-stats-data-table";
import { ModelStatsHeader } from "../components/model-stats/model-stats-header";
import { ModelStatsMergePanel } from "../components/model-stats/model-stats-merge-panel";
import { ModelStatsMiniCharts } from "../components/model-stats/model-stats-mini-charts";
import { ModelStatsSummaryCards } from "../components/model-stats/model-stats-summary-cards";
import { ModelStatsTopTables } from "../components/model-stats/model-stats-top-tables";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { PageLayout } from "../components/ui/page-layout";
import { Toaster } from "../components/ui/sonner";
import { MODEL_STATS_COLUMNS } from "./model-stats/model-stats-types";
import { useModelStatsPageState } from "./model-stats/use-model-stats-page";

export function ModelStatsPage() {
  const state = useModelStatsPageState();

  const maxTokensPerSecond = Math.max(
    ...state.data.map((m) => Number(m.max_tokens_per_second || 0)),
    0,
  );

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
    <PageLayout
      title="Model Statistics"
      icon={BarChart3}
      showFilters
      filters={
        <ModelStatsHeader
          columns={MODEL_STATS_COLUMNS}
          visibleColumns={state.visibleColumns}
          searchQuery={state.searchQuery}
          onToggleColumn={state.toggleColumn}
          onSearchChange={state.setSearchQuery}
          selectedDateRange={state.selectedDateRange}
          setSelectedDateRange={state.setSelectedDateRange}
        />
      }
      buttons={
        <Button
          size="sm"
          variant="outline"
          onClick={() => state.setMergeMode((prev) => !prev)}
        >
          {state.mergeMode ? "Cancel" : "Merge Models"}
        </Button>
      }
    >
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

      <div className="mt-6">
        <ModelStatsSummaryCards
          loading={state.loading}
          rangeLabel={state.rangeLabel}
          totalSpend={state.totalSpend}
          totalRequests={state.totalRequests}
          totalTokens={state.totalTokens}
          avgSuccessRate={state.avgSuccessRate}
          totalErrors={state.totalErrors}
          avgLatency={state.avgLatency}
          avgCostPerRequest={state.avgCostPerRequest}
          uniqueModels={state.uniqueModels}
          maxTokensPerSecond={maxTokensPerSecond}
        />
      </div>

      <div className="mt-6">
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
      </div>

      <div className="mt-6">
        <ModelStatsTopTables
          data={state.data}
          loading={state.loading}
          rangeLabel={state.rangeLabel}
        />
      </div>

      <div className="mt-6">
        <ModelStatsMiniCharts data={state.data} loading={state.loading} />
      </div>
    </PageLayout>
  );
}

export default ModelStatsPage;
