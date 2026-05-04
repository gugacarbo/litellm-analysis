import { useCallback, useEffect, useState } from "react";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { getMonitorAlerts } from "../../lib/api-client/monitor";
import { formatDateTime } from "../../lib/spend-log-utils";
import { cn } from "../../lib/utils";
import type {
  ModelHealthEntry,
  MonitorAlert,
} from "../../pages/monitor/monitor-types";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AlertFilters, type AlertFiltersState } from "./alert-filters";
import { AlertSeverityBadge } from "./alert-severity-badge";
import { AlertTypeBadge } from "./alert-type-badge";
import { HealthStatusBadge } from "./health-status-badge";

const PAGE_SIZE = 20;

interface AlertHistoryTableProps {
  lastAlerts: MonitorAlert[];
  models: ModelHealthEntry[];
  onAcknowledge: (id: number) => void;
  isAcknowledging?: boolean;
  onAlertClick?: (alert: MonitorAlert) => void;
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 95) return "text-green-600";
  if (rate >= 90) return "text-amber-600";
  return "text-red-600";
}

function getErrorBarColor(rate: number): string {
  if (rate > 20) return "bg-red-500";
  if (rate > 10) return "bg-amber-500";
  return "bg-green-500";
}

function getLastTs(model: ModelHealthEntry): string | null {
  return (
    [model.stats?.last_error_at, model.last_error_at].find((t) => t != null) ??
    null
  );
}

function isOlderThan(minutes: number, iso: string | null): boolean {
  if (iso == null) return true;
  return Date.now() - new Date(iso).getTime() > minutes * 60 * 1000;
}

function MiniIssueCard({
  model,
  onClick,
}: {
  model: ModelHealthEntry;
  onClick: () => void;
}) {
  const lastTs = getLastTs(model);
  const stale = isOlderThan(30, lastTs);

  const borderColor = stale
    ? "border-muted"
    : model.status === "offline"
      ? "border-red-500/50 bg-red-50 dark:bg-red-950/20"
      : model.status === "degraded"
        ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20"
        : "border-border";

  const statusLabel =
    model.status === "offline"
      ? "Offline"
      : model.status === "degraded"
        ? "Degraded"
        : "Healthy";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-all hover:bg-muted/50",
        stale && "opacity-40 grayscale",
        borderColor,
      )}
    >
      <div className="min-w-0">
        <span className="block truncate text-xs font-medium">
          {model.model}
        </span>
        <span className="block text-[9px] text-muted-foreground">
          {statusLabel}
          {lastTs != null && (
            <>
              {" · "}
              {new Date(lastTs).toLocaleTimeString(APP_LOCALE, {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: APP_TIMEZONE,
              })}
            </>
          )}
        </span>
      </div>
    </button>
  );
}

function ModelDetailDialog({
  model,
  open,
  onOpenChange,
}: {
  model: ModelHealthEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (model == null) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{model.model}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <HealthStatusBadge status={model.status} />
            <span className="text-xs text-muted-foreground">
              {model.error_rate_1h.toFixed(1)}% errors
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                getErrorBarColor(model.error_rate_1h),
              )}
              style={{
                width: `${Math.min(model.error_rate_1h, 100)}%`,
              }}
            />
          </div>

          {model.stats != null ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Success Rate
                </span>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    model.stats.total_requests > 0
                      ? getSuccessRateColor(
                          (model.stats.success_count /
                            model.stats.total_requests) *
                            100,
                        )
                      : "text-muted-foreground",
                  )}
                >
                  {model.stats.total_requests > 0
                    ? `${((model.stats.success_count / model.stats.total_requests) * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Requests (1h)
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.total_requests.toLocaleString(APP_LOCALE)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  P95 Latency
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.p95_latency_ms != null
                    ? `${model.stats.p95_latency_ms.toFixed(0)}ms`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Avg Latency
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.avg_latency_ms != null
                    ? `${model.stats.avg_latency_ms.toFixed(0)}ms`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Errors
                </span>
                <p className="text-lg font-semibold">
                  {model.stats.error_count.toLocaleString(APP_LOCALE)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  Last Activity
                </span>
                <p className="truncate text-sm font-medium">
                  {model.stats.last_success_at
                    ? new Date(model.stats.last_success_at).toLocaleString(APP_LOCALE, {
                        timeZone: APP_TIMEZONE,
                      })
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Detailed stats available once WebSocket connects.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlertHistoryTable({
  lastAlerts,
  models,
  onAcknowledge,
  isAcknowledging = false,
  onAlertClick,
}: AlertHistoryTableProps) {
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelHealthEntry | null>(
    null,
  );
  const [filters, setFilters] = useState<AlertFiltersState>({
    anomalyType: "",
    severity: "",
    model: "",
  });

  const recentIssues = models.filter(
    (m) => m.status !== "healthy" && m.status !== "unknown",
  );
  const topIssues = recentIssues.slice(0, 3);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonitorAlerts({
        anomalyType: filters.anomalyType || undefined,
        severity: filters.severity || undefined,
        model: filters.model || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setAlerts(res.alerts);
      setTotal(res.total);
    } catch {
      // Silent fail — table stays empty or shows previous data
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (lastAlerts.length === 0 || offset !== 0) return;

    setAlerts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const newOnes = lastAlerts.filter((a) => !existingIds.has(a.id));
      if (newOnes.length === 0) return prev;
      return [...newOnes, ...prev].slice(0, PAGE_SIZE);
    });
  }, [lastAlerts, offset]);

  const handleAcknowledge = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onAcknowledge(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail — alert stays visible
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleApplyFilters = () => {
    setOffset(0);
    fetchAlerts();
  };

  const handleClearFilters = () => {
    setFilters({ anomalyType: "", severity: "", model: "" });
    setOffset(0);
  };

  return (
    <Card>
      <CardHeader className="border-b px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Alert History</CardTitle>
            <CardDescription className="text-xs">
              {loading
                ? "Loading alerts..."
                : total > 0
                  ? `${total.toLocaleString(APP_LOCALE)} matching alerts`
                  : "No alerts detected — the system is running normally"}
            </CardDescription>
          </div>

          {topIssues.length > 0 && (
            <div className="hidden items-center gap-1.5 lg:flex">
              {topIssues.map((model) => (
                <MiniIssueCard
                  key={model.model}
                  model={model}
                  onClick={() => setSelectedModel(model)}
                />
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        <AlertFilters
          values={filters}
          onValuesChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && alerts.length === 0 ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 6 }).map((_, colIndex) => (
                      <TableCell key={`${rowIndex}-${colIndex}`}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={
                      onAlertClick ? "cursor-pointer hover:bg-muted/50" : ""
                    }
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(
                        new Date(alert.detectedAt * 1000).toISOString(),
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertTypeBadge type={alert.anomalyType} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {alert.model ?? "-"}
                    </TableCell>
                    <TableCell>
                      <AlertSeverityBadge severity={alert.severity} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {alert.message}
                    </TableCell>
                    <TableCell className="text-right">
                      {alert.acknowledgedAt ? (
                        <span className="text-xs text-muted-foreground">
                          Acknowledged
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isAcknowledging}
                          onClick={(e) => handleAcknowledge(alert.id, e)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({total.toLocaleString(APP_LOCALE)} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ModelDetailDialog
        model={selectedModel}
        open={selectedModel !== null}
        onOpenChange={(v) => {
          if (!v) setSelectedModel(null);
        }}
      />
    </Card>
  );
}
