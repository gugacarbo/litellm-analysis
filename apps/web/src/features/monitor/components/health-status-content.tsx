import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  type LucideIcon,
  PercentCircle,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { useHealthStatusPage } from "../hooks/use-health-status-page";
import type { ModelWithStatus } from "../hooks/use-health-status-state";
import type { HealthCheckResultEntry } from "../types/health-status-types";
import { STATUS_COLORS } from "../utils/health-status-utils";
import { HealthCheckTable } from "./health-check-table";
import { StatusDetailsDialog } from "./status-details-dialog";

interface HealthStatusContentProps {
  embedded?: boolean;
  runButton?: ReactNode;
}

export function SmallStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
      {Icon ? <Icon className="size-3.5" style={{ color }} /> : null}
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export function RunHealthCheckButton() {
  const { actions } = useHealthStatusPage();

  return (
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
}

export function HealthStatusContent({
  embedded = false,
}: HealthStatusContentProps) {
  const { state, actions, derived, runningExecutions, partialMessages } =
    useHealthStatusPage();
  const [selectedStatus, setSelectedStatus] = useState<
    ModelWithStatus | HealthCheckResultEntry | null
  >(null);

  const total = derived.sorted.length;
  const totalHistory = state.resultsQuery.data?.total ?? 0;
  const healthPercent =
    total > 0 ? `${Math.round((derived.healthyCount / total) * 100)}%` : "0%";

  const page =
    state.resultsLimit > 0
      ? Math.floor(state.resultsOffset / state.resultsLimit) + 1
      : 1;
  const totalPages =
    state.resultsLimit > 0 ? Math.ceil(totalHistory / state.resultsLimit) : 1;
  const start = totalHistory > 0 ? state.resultsOffset + 1 : 0;
  const end = Math.min(state.resultsOffset + state.resultsLimit, totalHistory);

  return (
    <div className={embedded ? "space-y-4" : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SmallStat
            icon={PercentCircle}
            label="Health rate"
            value={healthPercent}
            color={
              derived.healthyCount === total
                ? STATUS_COLORS.healthy
                : STATUS_COLORS.unhealthy
            }
          />
          <SmallStat
            icon={AlertCircle}
            label="Error"
            value={derived.errorCount}
            color={STATUS_COLORS.error}
          />
          <SmallStat
            icon={XCircle}
            label="Unhealthy"
            value={derived.unhealthyCount}
            color={STATUS_COLORS.unhealthy}
          />
          <SmallStat
            icon={CheckCircle2}
            label="Healthy"
            value={derived.healthyCount}
            color={STATUS_COLORS.healthy}
          />
        </div>
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
      </div>

      <HealthCheckTable
        entries={state.resultsQuery.data?.checks ?? []}
        isLoading={state.resultsQuery.isPending}
        isError={state.resultsQuery.isError}
        isGlobalRunning={actions.isGlobalRunning}
        isModelRunning={actions.isModelRunning}
        total={totalHistory}
        offset={state.resultsOffset}
        page={page}
        totalPages={totalPages}
        start={start}
        end={end}
        onSelect={setSelectedStatus}
        onTest={(modelName) => void actions.triggerSingleRun(modelName)}
        onPrevPage={() =>
          state.setResultsOffset(
            Math.max(0, state.resultsOffset - state.resultsLimit),
          )
        }
        onNextPage={() =>
          state.setResultsOffset(state.resultsOffset + state.resultsLimit)
        }
      />

      <StatusDetailsDialog
        selected={selectedStatus}
        runningExecutions={runningExecutions}
        partialMessages={partialMessages}
        onClose={() => setSelectedStatus(null)}
      />
    </div>
  );
}
