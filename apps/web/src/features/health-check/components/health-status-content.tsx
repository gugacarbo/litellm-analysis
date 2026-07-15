import {
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
  PercentCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useHealthStatusPage } from "../hooks/use-health-status-page";
import type { ModelWithStatus } from "../hooks/use-health-status-state";
import type { HealthCheckResultEntry } from "../types/health-status-types";
import { STATUS_COLORS } from "../utils/health-status-utils";
import { HealthCheckTable } from "./health-check-table";
import { StatusDetailsDialog } from "./status-details-dialog";

function SmallStat({
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

interface HealthStatusContentProps {
  embedded?: boolean;
  readOnly?: boolean;
}

function modelWithStatusToEntry(
  model: ModelWithStatus,
): HealthCheckResultEntry {
  return {
    id: model.id ?? 0,
    modelName: model.modelName,
    status: model.status,
    responseTimeMs: model.responseTimeMs,
    ttftMs: model.ttftMs,
    outputTokens: model.outputTokens,
    tokensPerSecond: model.tokensPerSecond,
    statusCode: model.statusCode,
    promptSent: model.promptSent,
    responseReceived: model.responseReceived,
    requestPayload: model.requestPayload,
    responsePayload: model.responsePayload,
    errorMessage: model.errorMessage,
    source: model.source ?? "manual",
    checkedAt: model.checkedAt ?? 0,
  };
}

export function HealthStatusContent({
  embedded = false,
  readOnly = false,
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

  const historyPages =
    state.resultsLimit > 0 ? Math.ceil(totalHistory / state.resultsLimit) : 0;
  const totalPages = 1 + historyPages;
  const latestEntries = derived.sorted.map(modelWithStatusToEntry);
  const tableEntries = state.isLatestPage
    ? latestEntries
    : (state.resultsQuery.data?.checks ?? []);
  const tableIsLoading = state.isLatestPage
    ? state.modelsQuery.isPending || state.latestQuery.isPending
    : state.resultsQuery.isPending;
  const tableIsError = state.isLatestPage
    ? state.modelsQuery.isError || state.latestQuery.isError
    : state.resultsQuery.isError;

  const start = state.isLatestPage
    ? total > 0
      ? 1
      : 0
    : totalHistory > 0
      ? state.historyOffset + 1
      : 0;
  const end = state.isLatestPage
    ? total
    : Math.min(state.historyOffset + state.resultsLimit, totalHistory);

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
        {readOnly ? (
          <p className="text-sm text-muted-foreground">
            This deprecated surface is read-only. Run health checks in apps/ui.
          </p>
        ) : null}
      </div>

      <HealthCheckTable
        entries={tableEntries}
        isLoading={tableIsLoading}
        isError={tableIsError}
        isGlobalRunning={actions.isGlobalRunning}
        isModelRunning={actions.isModelRunning}
        isLatestPage={state.isLatestPage}
        total={state.isLatestPage ? total : totalHistory}
        page={state.resultsPage}
        totalPages={totalPages}
        start={start}
        end={end}
        onSelect={setSelectedStatus}
        onTest={
          readOnly
            ? undefined
            : (modelName) => void actions.triggerSingleRun(modelName)
        }
        onPrevPage={() =>
          state.setResultsPage(Math.max(0, state.resultsPage - 1))
        }
        onNextPage={() =>
          state.setResultsPage(Math.min(totalPages - 1, state.resultsPage + 1))
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
