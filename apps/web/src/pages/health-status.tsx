import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Loader2,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import type { HealthCheckResultEntry } from "./health-status/health-status-types";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTokensPerSecond,
  formatTimestamp,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./health-status/health-status-utils";
import { useHealthStatusPage } from "./health-status/use-health-status-page";
import type { ModelWithStatus } from "./health-status/use-health-status-state";

interface HealthStatusContentProps {
  embedded?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ...STATUS_COLORS,
    unknown: "#9ca3af",
    checking: "#2563eb",
  };
  const labelMap: Record<string, string> = {
    ...STATUS_LABELS,
    unknown: "Not tested",
    checking: "Checking",
  };
  const color = colorMap[status] ?? "#9ca3af";

  return (
    <Badge
      variant="outline"
      className="gap-1 shrink-0"
      style={{ borderColor: color, color }}
    >
      {status === "healthy" ? (
        <CheckCircle className="size-3" />
      ) : status === "checking" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : status === "unknown" ? (
        <Clock className="size-3" />
      ) : status === "error" ? (
        <XCircle className="size-3" />
      ) : (
        <AlertTriangle className="size-3" />
      )}
      {labelMap[status] ?? status}
    </Badge>
  );
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

function formatPayload(payload: string | null): string {
  if (!payload) return "No payload";
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

function StatusDetailsDialog({
  selected,
}: {
  selected: ModelWithStatus | HealthCheckResultEntry | null;
}) {
  if (!selected) return null;

  return (
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
      <DialogHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <DialogTitle className="flex items-center gap-2">
            Status Details
            <StatusBadge status={selected.status} />
          </DialogTitle>
          <DialogDescription>{selected.modelName}</DialogDescription>
        </div>
        <div className="pt-0.5 text-right">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Last check
          </div>
          {selected.checkedAt ? (
            <div className="mt-0.5 space-y-0.5">
              <div className="text-xs">{formatTimestamp(selected.checkedAt)}</div>
              <div className="text-[11px] text-muted-foreground">
                {formatRelativeTime(selected.checkedAt)}
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-xs">—</div>
          )}
        </div>
      </DialogHeader>

      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Latency</div>
            <div className="mt-1 font-mono text-sm">
              {formatResponseTime(selected.responseTimeMs)}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">TTFT</div>
            <div className="mt-1 font-mono text-sm">
              {formatResponseTime(selected.ttftMs)}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Tokens/s</div>
            <div className="mt-1 font-mono text-sm">
              {formatTokensPerSecond(selected.tokensPerSecond)}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Output tokens</div>
            <div className="mt-1 font-mono text-sm tabular-nums">
              {selected.outputTokens ?? "—"}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">HTTP</div>
            <div className="mt-1 font-mono text-sm">
              {selected.statusCode ?? "—"}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Source</div>
            <div className="mt-1 font-mono text-sm uppercase">
              {selected.source ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">Prompt sent</div>
          <div className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs">
            {selected.promptSent ?? "No prompt"}
          </div>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">Response received</div>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs">
            {formatPayload(selected.responseReceived)}
          </pre>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">Request payload</div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs">
            {formatPayload(selected.requestPayload)}
          </pre>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">
            Full response payload
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs">
            {formatPayload(selected.responsePayload)}
          </pre>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquareText className="size-3.5" />
            Error message
          </div>
          <div className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs">
            {selected.errorMessage ?? "No error"}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export function HealthStatusContent({
  embedded = false,
}: HealthStatusContentProps) {
  const { state, actions, derived } = useHealthStatusPage();
  const [activeTab, setActiveTab] = useState<"models" | "history">("models");
  const [selectedStatus, setSelectedStatus] =
    useState<ModelWithStatus | HealthCheckResultEntry | null>(null);

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
        <SmallStat label="Errors" value={derived.errorCount} color={STATUS_COLORS.error} />
        <SmallStat label="Unknown" value={derived.unknownCount} color="#94a3b8" />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "models" | "history")}>
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
          {state.latestQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading latest checks...
            </div>
          ) : state.latestQuery.isError ? (
            <div className="py-8 text-center text-sm text-destructive">
              Failed to load latest health check results.
            </div>
          ) : derived.sorted.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No models configured.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-9 px-3 text-start text-xs font-medium text-muted-foreground">
                      Model
                    </th>
                    <th className="h-9 w-[170px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Latency / HTTP
                    </th>
                    <th className="h-9 w-[180px] px-3 text-start text-xs font-medium text-muted-foreground">
                      TTFT / Tokens/s
                    </th>
                    <th className="h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Last Check
                    </th>
                    <th className="h-9 w-[80px] px-3 text-center text-xs font-medium text-muted-foreground">
                      Test
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {derived.sorted.map((model: ModelWithStatus) => {
                    const modelIsRunning = actions.isModelRunning(
                      model.modelName,
                    );
                    const isIndividualButtonDisabled =
                      actions.isGlobalRunning || modelIsRunning;
                    const displayStatus =
                      isIndividualButtonDisabled ? "checking" : model.status;

                    return (
                      <tr
                        key={model.modelName}
                        className="border-b transition-colors hover:bg-muted/20 last:border-0"
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="rounded"
                            onClick={() => setSelectedStatus(model)}
                          >
                            <StatusBadge status={displayStatus} />
                          </button>
                        </td>
                        <td className="max-w-[260px] truncate px-3 py-2 font-medium">
                          {model.modelName}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs tabular-nums">
                              {formatResponseTime(model.responseTimeMs)}
                            </span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {model.statusCode ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs tabular-nums">
                              {formatResponseTime(model.ttftMs)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                              {formatTokensPerSecond(model.tokensPerSecond)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {model.checkedAt ? (
                            <span title={formatTimestamp(model.checkedAt)}>
                              {formatRelativeTime(model.checkedAt)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              actions.triggerSingleRun(model.modelName)
                            }
                            disabled={isIndividualButtonDisabled}
                          >
                            Test
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-1">
          {state.resultsQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading history...
            </div>
          ) : state.resultsQuery.isError ? (
            <div className="py-8 text-center text-sm text-destructive">
              Failed to load health check history.
            </div>
          ) : !state.resultsQuery.data?.checks.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No history available.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-9 px-3 text-start text-xs font-medium text-muted-foreground">
                      Model
                    </th>
                    <th className="h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Latency
                    </th>
                    <th className="h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground">
                      TTFT
                    </th>
                    <th className="h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Tokens/s
                    </th>
                    <th className="h-9 w-[90px] px-3 text-start text-xs font-medium text-muted-foreground">
                      HTTP
                    </th>
                    <th className="h-9 w-[100px] px-3 text-start text-xs font-medium text-muted-foreground">
                      Source
                    </th>
                    <th className="h-9 px-3 text-start text-xs font-medium text-muted-foreground">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.resultsQuery.data.checks.map(
                    (entry: HealthCheckResultEntry) => (
                      <tr
                        key={entry.id}
                        className="border-b transition-colors hover:bg-muted/20 last:border-0"
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="rounded"
                            onClick={() => setSelectedStatus(entry)}
                          >
                            <StatusBadge status={entry.status} />
                          </button>
                        </td>
                        <td className="max-w-[260px] truncate px-3 py-2 font-medium">
                          {entry.modelName}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums">
                          {formatResponseTime(entry.responseTimeMs)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums">
                          {formatResponseTime(entry.ttftMs)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums">
                          {formatTokensPerSecond(entry.tokensPerSecond)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums">
                          {entry.statusCode ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            {entry.source}
                          </Badge>
                        </td>
                        <td
                          className="px-3 py-2 text-xs text-muted-foreground"
                          title={formatTimestamp(entry.checkedAt)}
                        >
                          {formatRelativeTime(entry.checkedAt)}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  Showing {start}–{end} of {totalHistory}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={state.resultsOffset === 0}
                    onClick={() =>
                      state.setResultsOffset(
                        Math.max(0, state.resultsOffset - state.resultsLimit),
                      )
                    }
                  >
                    <ChevronLeft className="size-3.5" />
                    Prev
                  </Button>
                  <span className="px-1 text-xs tabular-nums">
                    {historyPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={end >= totalHistory}
                    onClick={() =>
                      state.setResultsOffset(
                        state.resultsOffset + state.resultsLimit,
                      )
                    }
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
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

export function HealthStatusPage() {
  return <HealthStatusContent />;
}
