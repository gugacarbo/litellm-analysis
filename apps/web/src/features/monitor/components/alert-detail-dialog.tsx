import { APP_LOCALE } from "@/shared/lib/locale";
import { cn } from "@/shared/lib/utils";
import type {
  AlertMetadata,
  AnomalyType,
  ErrorSpikeMetadata,
  ModelOfflineMetadata,
  MonitorAlert,
  SilentFailureMetadata,
  TimeoutStuckMetadata,
} from "../../pages/monitor/monitor-types";
import {
  formatTimestamp,
  parseAlertMetadata,
} from "../../pages/monitor/monitor-utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DetailRow } from "../ui/detail-row";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AlertSeverityBadge } from "./alert-severity-badge";
import { AlertTypeBadge } from "./alert-type-badge";

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function ErrorSpikeView({ data }: { data: ErrorSpikeMetadata }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard
        label="Recent Errors (5min)"
        value={data.recent_error_count_5min.toLocaleString(APP_LOCALE)}
      />
      <MetricCard
        label="Spike Ratio"
        value={`${data.spike_ratio.toFixed(1)}x`}
      />
      <MetricCard
        label="Baseline Rate"
        value={`${data.baseline_hourly_rate.toFixed(1)}/hr`}
      />
      <MetricCard
        label="Current Rate"
        value={`${data.current_hourly_rate.toFixed(1)}/hr`}
      />
    </div>
  );
}

function ModelOfflineView({ data }: { data: ModelOfflineMetadata }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <MetricCard
        label="Recent Failure Count"
        value={data.recent_failure_count.toLocaleString(APP_LOCALE)}
      />
      <MetricCard label="Last Error At" value={data.last_error_at} />
      <MetricCard
        label="Last Success At"
        value={data.last_success_at ?? "N/A"}
      />
    </div>
  );
}

function TimeoutStuckView({ data }: { data: TimeoutStuckMetadata }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {data.stuck_request_count !== undefined && (
        <MetricCard
          label="Stuck Request Count"
          value={data.stuck_request_count.toLocaleString(APP_LOCALE)}
        />
      )}
      <MetricCard
        label="P95 Latency"
        value={`${data.p95_latency_ms.toFixed(0)} ms`}
      />
      <MetricCard
        label="Avg Latency"
        value={`${data.avg_latency_ms.toFixed(0)} ms`}
      />
      {data.latency_ratio !== undefined && (
        <MetricCard
          label="Latency Ratio"
          value={data.latency_ratio.toFixed(2)}
        />
      )}
    </div>
  );
}

function SilentFailureView({ data }: { data: SilentFailureMetadata }) {
  return (
    <div className="space-y-3">
      <MetricCard
        label="Silent Failure Count"
        value={data.silent_failure_count.toLocaleString(APP_LOCALE)}
      />
      {data.sample_errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Sample Errors</p>
          <ul className="space-y-1">
            {data.sample_errors.map((err, i) => (
              <li
                key={i}
                className="rounded bg-muted px-2 py-1 font-mono text-xs
                  text-muted-foreground"
              >
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetadataView({
  metadata,
  anomalyType,
}: {
  metadata: AlertMetadata;
  anomalyType: string;
}) {
  switch (anomalyType as AnomalyType) {
    case "error_spike":
      return <ErrorSpikeView data={metadata as ErrorSpikeMetadata} />;
    case "model_offline":
      return <ModelOfflineView data={metadata as ModelOfflineMetadata} />;
    case "timeout_stuck":
      return <TimeoutStuckView data={metadata as TimeoutStuckMetadata} />;
    case "silent_failure":
      return <SilentFailureView data={metadata as SilentFailureMetadata} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          No additional data available for this alert type.
        </p>
      );
  }
}

interface AlertDetailDialogProps {
  alert: MonitorAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcknowledge: (id: number) => void;
}

export function AlertDetailDialog({
  alert,
  open,
  onOpenChange,
  onAcknowledge,
}: AlertDetailDialogProps) {
  if (!alert) return null;

  const parsed = parseAlertMetadata(alert.metadata);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alert Details</DialogTitle>
          <DialogDescription>
            Detailed information about this monitoring alert.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <AlertTypeBadge type={alert.anomalyType} />
          <span className="font-mono text-sm font-medium">
            {alert.model ?? "Unknown model"}
          </span>
          <AlertSeverityBadge severity={alert.severity} />
          {alert.acknowledgedAt && (
            <Badge variant="outline" className="text-xs">
              Acknowledged
            </Badge>
          )}
        </div>

        <div className="rounded-md bg-muted p-3">
          <p className="text-sm">{alert.message}</p>
        </div>

        {parsed && (
          <section className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Detector Data
            </h4>
            <MetadataView metadata={parsed} anomalyType={alert.anomalyType} />
          </section>
        )}

        <section className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Timeline</h4>
          <dl className="divide-y divide-border rounded-lg border">
            <DetailRow
              label="Detected"
              value={formatTimestamp(alert.detectedAt)}
            />
            <DetailRow
              label="Created"
              value={formatTimestamp(alert.createdAt)}
            />
            <DetailRow
              label="Acknowledged"
              value={
                alert.acknowledgedAt
                  ? formatTimestamp(alert.acknowledgedAt)
                  : "\u2014"
              }
            />
          </dl>
        </section>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!alert.acknowledgedAt && (
            <Button onClick={() => onAcknowledge(alert.id)}>Acknowledge</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
