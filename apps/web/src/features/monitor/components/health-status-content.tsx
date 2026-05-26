import { Activity, History, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useHealthStatusPage } from "../hooks/use-health-status-page";
import type { ModelWithStatus } from "../hooks/use-health-status-state";
import type { HealthCheckResultEntry } from "../types/health-status-types";
import { STATUS_COLORS } from "../utils/health-status-utils";
import { HistoryTable } from "./history-table";
import { ModelsTable } from "./models-table";
import { StatusDetailsDialog } from "./status-details-dialog";

interface HealthStatusContentProps {
  embedded?: boolean;
}

function SmallStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

export function HealthStatusContent({
  embedded = false,
}: HealthStatusContentProps) {
  const { state, actions, derived } = useHealthStatusPage();
  const [activeTab, setActiveTab] = useState<"models" | "history">("models");
  const [selectedStatus, setSelectedStatus] = useState<
    ModelWithStatus | HealthCheckResultEntry | null
  >(null);

  const total = derived.sorted.length;
  const totalHistory = state.resultsQuery.data?.total ?? 0;
  const healthPercent =
    total > 0 ? `${Math.round((derived.healthyCount / total) * 100)}%` : "0%";

  const historyPage =
    state.resultsLimit > 0
      ? Math.floor(state.resultsOffset / state.resultsLimit) + 1
      : 1;
  const totalPages =
    state.resultsLimit > 0 ? Math.ceil(totalHistory / state.resultsLimit) : 1;
  const start = totalHistory > 0 ? state.resultsOffset + 1 : 0;
  const end = Math.min(state.resultsOffset + state.resultsLimit, totalHistory);

  const runHealthCheckButton = (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => actions.triggerRun()}
      disabled={actions.isGlobalRunning}
    >
      {actions.isGlobalRunning ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Running...
        </>
      ) : (
        <>
          <Activity className="size-3.5" />
          Run health check
        </>
      )}
    </Button>
  );

  return (
    <div className={embedded ? "space-y-4" : undefined}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Health check</h2>
          <p className="text-sm text-muted-foreground">
            Real-time model health status and test results.
          </p>
        </div>
        {runHealthCheckButton}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SmallStat
          label="Healthy"
          value={derived.healthyCount}
          color={STATUS_COLORS.healthy}
        />
        <SmallStat
          label="Unhealthy"
          value={derived.unhealthyCount}
          color={STATUS_COLORS.unhealthy}
        />
        <SmallStat
          label="Error"
          value={derived.errorCount}
          color={STATUS_COLORS.error}
        />
        <SmallStat
          label="Health rate"
          value={healthPercent}
          color={
            derived.healthyCount === total
              ? STATUS_COLORS.healthy
              : STATUS_COLORS.unhealthy
          }
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "models" | "history")}
      >
        <TabsList variant="line">
          <TabsTrigger value="models" className="gap-1.5">
            <Activity className="size-3.5" />
            Models
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-4">
          <ModelsTable
            models={derived.sorted}
            isLoading={
              state.latestQuery.isPending || state.modelsQuery.isPending
            }
            isError={state.latestQuery.isError || state.modelsQuery.isError}
            isGlobalRunning={actions.isGlobalRunning}
            isModelRunning={actions.isModelRunning}
            onSelect={setSelectedStatus}
            onTest={(modelName) => void actions.triggerSingleRun(modelName)}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTable
            entries={state.resultsQuery.data?.checks ?? []}
            isLoading={state.resultsQuery.isPending}
            isError={state.resultsQuery.isError}
            total={totalHistory}
            offset={state.resultsOffset}
            page={historyPage}
            totalPages={totalPages}
            start={start}
            end={end}
            onSelect={setSelectedStatus}
            onPrevPage={() =>
              state.setResultsOffset(
                Math.max(0, state.resultsOffset - state.resultsLimit),
              )
            }
            onNextPage={() =>
              state.setResultsOffset(state.resultsOffset + state.resultsLimit)
            }
          />
        </TabsContent>
      </Tabs>

      <StatusDetailsDialog selected={selectedStatus} />
    </div>
  );
}
