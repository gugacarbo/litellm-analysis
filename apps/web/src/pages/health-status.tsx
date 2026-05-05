import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Wifi,
  XCircle,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
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
  formatTimestamp,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./health-status/health-status-utils";
import { useHealthStatusPage } from "./health-status/use-health-status-page";
import type { ModelWithStatus } from "./health-status/use-health-status-state";

function ConnectionBadge({ status }: { status: string }) {
  const isConnected = status === "connected";
  return (
    <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
      <Wifi className="size-3" />
      {isConnected ? "Live" : "Reconnecting..."}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ...STATUS_COLORS,
    unknown: "#9ca3af",
  };
  const labelMap: Record<string, string> = {
    ...STATUS_LABELS,
    unknown: "Not tested",
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

function StatsBadge({
  label,
  count,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-md border bg-card">
      <span style={{ color }}>
        <Icon className="size-4 shrink-0" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold tabular-nums" style={{ color }}>
          {count}
        </div>
      </div>
    </div>
  );
}

function LatencyCell({
  ms,
  statusCode,
  errorMessage,
}: {
  ms: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}) {
  if (ms === null) return <span className="text-muted-foreground">—</span>;
  const color =
    ms < 500
      ? STATUS_COLORS.healthy
      : ms < 2000
        ? STATUS_COLORS.unhealthy
        : STATUS_COLORS.error;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs tabular-nums" style={{ color }}>
        {formatResponseTime(ms)}
      </span>
      {statusCode !== null && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {statusCode}
        </span>
      )}
      {errorMessage && (
        <span
          className="text-[10px] text-muted-foreground truncate max-w-32"
          title={errorMessage}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
}

export function HealthStatusPage() {
  const { state, actions, derived } = useHealthStatusPage();

  const total = derived.sorted.length;
  const healthy = derived.healthyCount;
  const unhealthy = derived.unhealthyCount;
  const errorCount = derived.errorCount;
  const unknownCount = derived.unknownCount;

  const totalHistory = state.resultsQuery.data?.total ?? 0;
  const historyPage =
    state.resultsLimit > 0
      ? Math.floor(state.resultsOffset / state.resultsLimit) + 1
      : 1;
  const totalPages =
    state.resultsLimit > 0 ? Math.ceil(totalHistory / state.resultsLimit) : 1;
  const start = totalHistory > 0 ? state.resultsOffset + 1 : 0;
  const end = Math.min(state.resultsOffset + state.resultsLimit, totalHistory);

  return (
    <PageLayout
      title="Health Status"
      subtitle="Active model health checks"
      icon={Activity}
      buttons={
        <div className="flex items-center gap-2">
          <ConnectionBadge status={state.wsStatus} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => actions.triggerRun()}
            disabled={actions.isRunning}
          >
            {actions.isRunning ? "Running..." : "Run Health Check"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-3">
        <StatsBadge
          label="Healthy"
          count={healthy}
          color={STATUS_COLORS.healthy}
          icon={CheckCircle}
        />
        <StatsBadge
          label="Unhealthy"
          count={unhealthy}
          color={STATUS_COLORS.unhealthy}
          icon={AlertTriangle}
        />
        <StatsBadge
          label="Errors"
          count={errorCount}
          color={STATUS_COLORS.error}
          icon={XCircle}
        />
        <StatsBadge
          label="Unknown"
          count={unknownCount}
          color="#94a3b8"
          icon={Clock}
        />
      </div>

      <Tabs defaultValue="models">
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

        <TabsContent value="models" className="mt-3">
          {derived.sorted.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No models configured.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[120px]">
                      Status
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground">
                      Model
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[180px]">
                      Latency / HTTP
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[120px]">
                      Last Check
                    </th>
                    <th className="h-9 px-3 text-center font-medium text-xs text-muted-foreground w-[70px]">
                      Test
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {derived.sorted.map((model: ModelWithStatus) => (
                    <tr
                      key={model.modelName}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <StatusBadge status={model.status} />
                      </td>
                      <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                        {model.modelName}
                      </td>
                      <td className="px-3 py-2">
                        <LatencyCell
                          ms={model.responseTimeMs}
                          statusCode={model.statusCode}
                          errorMessage={model.errorMessage}
                        />
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
                          disabled={actions.isRunning}
                        >
                          Test
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {!state.resultsQuery.data?.checks.length ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No history available.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[120px]">
                      Status
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground">
                      Model
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[140px]">
                      Latency
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[100px]">
                      HTTP
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground w-[100px]">
                      Source
                    </th>
                    <th className="h-9 px-3 text-start font-medium text-xs text-muted-foreground">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.resultsQuery.data.checks.map(
                    (entry: HealthCheckResultEntry) => (
                      <tr
                        key={entry.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                          {entry.modelName}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums">
                          {formatResponseTime(entry.responseTimeMs)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums">
                          {entry.statusCode ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
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
              <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
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
                  <span className="text-xs tabular-nums px-1">
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
    </PageLayout>
  );
}
