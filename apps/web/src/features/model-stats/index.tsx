import { BarChart3 } from "lucide-react";
import { DeleteModelLogsDialog } from "@/features/model-stats/components/delete-model-logs-dialog";
import { ModelStatsDataTable } from "@/features/model-stats/components/model-stats-data-table";
import { ModelStatsHeader } from "@/features/model-stats/components/model-stats-header";
import { ModelStatsMiniCharts } from "@/features/model-stats/components/model-stats-mini-charts";
import { ModelStatsSummaryCards } from "@/features/model-stats/components/model-stats-summary-cards";
import { ModelStatsTopTables } from "@/features/model-stats/components/model-stats-top-tables";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { Toaster } from "@/shared/components/ui/sonner";
import { MODEL_STATS_COLUMNS } from "./model-stats-types";
import { useModelStatsPageState } from "./use-model-stats-page";

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
    <PageLayout
      title="Model Statistics"
      icon={BarChart3}
      showFilters
      filters={
        <ModelStatsHeader
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
        />
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

      <div className="mt-6">
        <ModelStatsSummaryCards
          loading={state.loading}
          totalSpend={state.totalSpend}
          totalRequests={state.totalRequests}
          totalTokens={state.totalTokens}
          totalCompletionTokens={state.totalCompletionTokens}
          avgSuccessRate={state.avgSuccessRate}
          avgLatency={state.avgLatency}
          avgTokensPerSecond={state.avgTokensPerSecond}
          avgCostPerRequest={state.avgCostPerRequest}
          topSpendModel={state.topSpendModel}
          topSpendValue={state.topSpendValue}
          topEfficiencyModel={state.topEfficiencyModel}
          bestCostPer1k={state.bestCostPer1k}
        />
      </div>

      <div className="mt-6">
        <ModelStatsDataTable
          loading={state.loading}
          data={state.sortedData}
          visibleColumns={state.visibleColumns}
          columnConfig={MODEL_STATS_COLUMNS}
          onToggleColumn={state.toggleColumn}
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
