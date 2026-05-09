import { Activity, History, Loader2 } from "lucide-react";
import { useState } from "react";
import { HistoryTable } from "../components/health-status/history-table";
import { ModelsTable } from "../components/health-status/models-table";
import { StatusDetailsDialog } from "../components/health-status/status-details-dialog";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import type { HealthCheckResultEntry } from "./health-status/health-status-types";
import { STATUS_COLORS } from "./health-status/health-status-utils";
import { useHealthStatusPage } from "./health-status/use-health-status-page";
import type { ModelWithStatus } from "./health-status/use-health-status-state";

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
        "Run Health Check"
      )}
    </Button>
  );

  const content = (
    <div className="space-y-4">
      <Dialog
        open={selectedStatus !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedStatus(null);
        }}
      >
        <StatusDetailsDialog selected={selectedStatus} />
      </Dialog>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <SmallStat label="Coverage" value={healthPercent} color="#0ea5e9" />
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
          label="Errors"
          value={derived.errorCount}
          color={STATUS_COLORS.error}
        />
        <SmallStat
          label="Unknown"
          value={derived.unknownCount}
          color="#94a3b8"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "models" | "history")}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="models">
              <Activity className="size-3.5" />
              Models ({total})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="size-3.5" />
              History
            </TabsTrigger>
          </TabsList>
          {runHealthCheckButton}
        </div>

        <TabsContent value="models" className="pt-1">
          <ModelsTable
            models={derived.sorted}
            isLoading={state.latestQuery.isLoading}
            isError={state.latestQuery.isError}
            isGlobalRunning={actions.isGlobalRunning}
            isModelRunning={actions.isModelRunning}
            onSelect={setSelectedStatus}
            onTest={actions.triggerSingleRun}
          />
        </TabsContent>

        <TabsContent value="history" className="pt-1">
          <HistoryTable
            entries={state.resultsQuery.data?.checks ?? []}
            isLoading={state.resultsQuery.isLoading}
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
    </div>
  );

  if (embedded) return content;

  return (
    <PageLayout
      title="Health Check"
      subtitle="Model status and probe history"
      icon={Activity}
    >
      {content}
    </PageLayout>
  );
}
