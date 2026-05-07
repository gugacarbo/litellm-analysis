import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE } from "@/lib/locale";
import { cn } from "../../lib/utils";
import {
  formatTimestamp,
  parseAlertMetadata,
} from "../../pages/monitor/monitor-utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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

function MetricCard({ label, value, className }) {
  return _jsxs("div", {
    className: cn("space-y-1", className),
    children: [
      _jsx("p", {
        className: "text-xs text-muted-foreground",
        children: label,
      }),
      _jsx("p", { className: "text-sm font-medium", children: value }),
    ],
  });
}
function ErrorSpikeView({ data }) {
  return _jsxs("div", {
    className: "grid grid-cols-2 gap-4 sm:grid-cols-4",
    children: [
      _jsx(MetricCard, {
        label: "Recent Errors (5min)",
        value: data.recent_error_count_5min.toLocaleString(APP_LOCALE),
      }),
      _jsx(MetricCard, {
        label: "Spike Ratio",
        value: `${data.spike_ratio.toFixed(1)}x`,
      }),
      _jsx(MetricCard, {
        label: "Baseline Rate",
        value: `${data.baseline_hourly_rate.toFixed(1)}/hr`,
      }),
      _jsx(MetricCard, {
        label: "Current Rate",
        value: `${data.current_hourly_rate.toFixed(1)}/hr`,
      }),
    ],
  });
}
function ModelOfflineView({ data }) {
  return _jsxs("div", {
    className: "grid grid-cols-2 gap-4 sm:grid-cols-3",
    children: [
      _jsx(MetricCard, {
        label: "Recent Failure Count",
        value: data.recent_failure_count.toLocaleString(APP_LOCALE),
      }),
      _jsx(MetricCard, { label: "Last Error At", value: data.last_error_at }),
      _jsx(MetricCard, {
        label: "Last Success At",
        value: data.last_success_at ?? "N/A",
      }),
    ],
  });
}
function TimeoutStuckView({ data }) {
  return _jsxs("div", {
    className: "grid grid-cols-2 gap-4 sm:grid-cols-4",
    children: [
      data.stuck_request_count !== undefined &&
        _jsx(MetricCard, {
          label: "Stuck Request Count",
          value: data.stuck_request_count.toLocaleString(APP_LOCALE),
        }),
      _jsx(MetricCard, {
        label: "P95 Latency",
        value: `${data.p95_latency_ms.toFixed(0)} ms`,
      }),
      _jsx(MetricCard, {
        label: "Avg Latency",
        value: `${data.avg_latency_ms.toFixed(0)} ms`,
      }),
      data.latency_ratio !== undefined &&
        _jsx(MetricCard, {
          label: "Latency Ratio",
          value: data.latency_ratio.toFixed(2),
        }),
    ],
  });
}
function SilentFailureView({ data }) {
  return _jsxs("div", {
    className: "space-y-3",
    children: [
      _jsx(MetricCard, {
        label: "Silent Failure Count",
        value: data.silent_failure_count.toLocaleString(APP_LOCALE),
      }),
      data.sample_errors.length > 0 &&
        _jsxs("div", {
          className: "space-y-1",
          children: [
            _jsx("p", {
              className: "text-xs text-muted-foreground",
              children: "Sample Errors",
            }),
            _jsx("ul", {
              className: "space-y-1",
              children: data.sample_errors.map((err, i) =>
                _jsx(
                  "li",
                  {
                    className:
                      "rounded bg-muted px-2 py-1 font-mono text-xs\n                  text-muted-foreground",
                    children: err,
                  },
                  i,
                ),
              ),
            }),
          ],
        }),
    ],
  });
}
function MetadataView({ metadata, anomalyType }) {
  switch (anomalyType) {
    case "error_spike":
      return _jsx(ErrorSpikeView, { data: metadata });
    case "model_offline":
      return _jsx(ModelOfflineView, { data: metadata });
    case "timeout_stuck":
      return _jsx(TimeoutStuckView, { data: metadata });
    case "silent_failure":
      return _jsx(SilentFailureView, { data: metadata });
    default:
      return _jsx("p", {
        className: "text-sm text-muted-foreground",
        children: "No additional data available for this alert type.",
      });
  }
}
export function AlertDetailDialog({
  alert,
  open,
  onOpenChange,
  onAcknowledge,
}) {
  if (!alert) return null;
  const parsed = parseAlertMetadata(alert.metadata);
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "sm:max-w-2xl max-h-[88vh] overflow-y-auto",
      children: [
        _jsxs(DialogHeader, {
          children: [
            _jsx(DialogTitle, { children: "Alert Details" }),
            _jsx(DialogDescription, {
              children: "Detailed information about this monitoring alert.",
            }),
          ],
        }),
        _jsxs("div", {
          className: "flex flex-wrap items-center gap-2",
          children: [
            _jsx(AlertTypeBadge, { type: alert.anomalyType }),
            _jsx("span", {
              className: "font-mono text-sm font-medium",
              children: alert.model ?? "Unknown model",
            }),
            _jsx(AlertSeverityBadge, { severity: alert.severity }),
            alert.acknowledgedAt &&
              _jsx(Badge, {
                variant: "outline",
                className: "text-xs",
                children: "Acknowledged",
              }),
          ],
        }),
        _jsx("div", {
          className: "rounded-md bg-muted p-3",
          children: _jsx("p", {
            className: "text-sm",
            children: alert.message,
          }),
        }),
        parsed &&
          _jsxs("section", {
            className: "space-y-2",
            children: [
              _jsx("h4", {
                className: "text-sm font-medium text-foreground",
                children: "Detector Data",
              }),
              _jsx(MetadataView, {
                metadata: parsed,
                anomalyType: alert.anomalyType,
              }),
            ],
          }),
        _jsxs("section", {
          className: "space-y-2",
          children: [
            _jsx("h4", {
              className: "text-sm font-medium text-foreground",
              children: "Timeline",
            }),
            _jsxs("div", {
              className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
              children: [
                _jsx(MetricCard, {
                  label: "Detected",
                  value: formatTimestamp(alert.detectedAt),
                }),
                _jsx(MetricCard, {
                  label: "Created",
                  value: formatTimestamp(alert.createdAt),
                }),
                _jsx(MetricCard, {
                  label: "Acknowledged",
                  value: alert.acknowledgedAt
                    ? formatTimestamp(alert.acknowledgedAt)
                    : "\u2014",
                }),
              ],
            }),
          ],
        }),
        _jsxs(DialogFooter, {
          children: [
            _jsx(Button, {
              variant: "outline",
              onClick: () => onOpenChange(false),
              children: "Close",
            }),
            !alert.acknowledgedAt &&
              _jsx(Button, {
                onClick: () => onAcknowledge(alert.id),
                children: "Acknowledge",
              }),
          ],
        }),
      ],
    }),
  });
}
