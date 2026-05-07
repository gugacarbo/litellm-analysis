import { useCallback, useEffect, useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { getMonitorAlerts } from "../../lib/api-client/monitor";
import { formatDateTime } from "../../lib/spend-log-utils";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AlertFilters } from "./alert-filters";
import { AlertSeverityBadge } from "./alert-severity-badge";
import { AlertTypeBadge } from "./alert-type-badge";
import { ModelDetailDialog } from "./model-detail-dialog";

const PAGE_SIZE = 10;
function getLastTs(model) {
  return (
    [model.stats?.last_error_at, model.last_error_at].find((t) => t != null) ??
    null
  );
}
function isOlderThan(minutes, iso) {
  if (iso == null) return true;
  return Date.now() - new Date(iso).getTime() > minutes * 60 * 1000;
}
function MiniIssueCard({ model, onClick }) {
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
  return _jsx("button", {
    type: "button",
    onClick: onClick,
    className: cn(
      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-all hover:bg-muted/50",
      stale && "opacity-40 grayscale",
      borderColor,
    ),
    children: _jsxs("div", {
      className: "min-w-0",
      children: [
        _jsx("span", {
          className: "block truncate text-xs font-medium",
          children: model.model,
        }),
        _jsxs("span", {
          className: "block text-[9px] text-muted-foreground",
          children: [
            statusLabel,
            lastTs != null &&
              _jsxs(_Fragment, {
                children: [
                  " · ",
                  new Date(lastTs).toLocaleTimeString(APP_LOCALE, {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: APP_TIMEZONE,
                  }),
                ],
              }),
          ],
        }),
      ],
    }),
  });
}
export function AlertHistoryTable({
  lastAlerts,
  models,
  onAcknowledge,
  isAcknowledging = false,
  onAlertClick,
}) {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [filters, setFilters] = useState({
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
  const handleAcknowledge = async (id, e) => {
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
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        className: "border-b px-4 py-2.5",
        children: _jsxs("div", {
          className: "flex items-center justify-between gap-4",
          children: [
            _jsxs("div", {
              className: "space-y-0.5",
              children: [
                _jsx(CardTitle, {
                  className: "text-base",
                  children: "Alert History",
                }),
                _jsx(CardDescription, {
                  className: "text-xs",
                  children: loading
                    ? "Loading alerts..."
                    : total > 0
                      ? `${total.toLocaleString(APP_LOCALE)} matching alerts`
                      : "No alerts detected — the system is running normally",
                }),
              ],
            }),
            topIssues.length > 0 &&
              _jsx("div", {
                className: "hidden items-center gap-1.5 lg:flex",
                children: topIssues.map((model) =>
                  _jsx(
                    MiniIssueCard,
                    { model: model, onClick: () => setSelectedModel(model) },
                    model.model,
                  ),
                ),
              }),
          ],
        }),
      }),
      _jsxs(CardContent, {
        className: "space-y-3 p-4 pt-0",
        children: [
          _jsx(AlertFilters, {
            values: filters,
            onValuesChange: setFilters,
            onApply: handleApplyFilters,
            onClear: handleClearFilters,
          }),
          _jsx("div", {
            className: "overflow-x-auto rounded-lg border",
            children: _jsxs(Table, {
              children: [
                _jsx(TableHeader, {
                  children: _jsxs(TableRow, {
                    children: [
                      _jsx(TableHead, { children: "Time" }),
                      _jsx(TableHead, { children: "Type" }),
                      _jsx(TableHead, { children: "Model" }),
                      _jsx(TableHead, { children: "Severity" }),
                      _jsx(TableHead, { children: "Message" }),
                      _jsx(TableHead, {
                        className: "text-right",
                        children: "Actions",
                      }),
                    ],
                  }),
                }),
                _jsx(TableBody, {
                  children:
                    loading && alerts.length === 0
                      ? Array.from({ length: 5 }).map((_, rowIndex) =>
                          _jsx(
                            TableRow,
                            {
                              children: Array.from({ length: 6 }).map(
                                (_, colIndex) =>
                                  _jsx(
                                    TableCell,
                                    {
                                      children: _jsx(Skeleton, {
                                        className: "h-4 w-24",
                                      }),
                                    },
                                    `${rowIndex}-${colIndex}`,
                                  ),
                              ),
                            },
                            rowIndex,
                          ),
                        )
                      : alerts.length === 0
                        ? _jsx(TableRow, {
                            children: _jsx(TableCell, {
                              colSpan: 6,
                              className:
                                "py-8 text-center text-muted-foreground",
                              children: "No alerts found",
                            }),
                          })
                        : alerts.map((alert) =>
                            _jsxs(
                              TableRow,
                              {
                                className: onAlertClick
                                  ? "cursor-pointer hover:bg-muted/50"
                                  : "",
                                onClick: () => onAlertClick?.(alert),
                                children: [
                                  _jsx(TableCell, {
                                    className:
                                      "whitespace-nowrap text-xs text-muted-foreground tabular-nums",
                                    children: formatDateTime(
                                      new Date(
                                        alert.detectedAt * 1000,
                                      ).toISOString(),
                                    ),
                                  }),
                                  _jsx(TableCell, {
                                    children: _jsx(AlertTypeBadge, {
                                      type: alert.anomalyType,
                                    }),
                                  }),
                                  _jsx(TableCell, {
                                    className: "font-mono text-xs",
                                    children: alert.model ?? "-",
                                  }),
                                  _jsx(TableCell, {
                                    children: _jsx(AlertSeverityBadge, {
                                      severity: alert.severity,
                                    }),
                                  }),
                                  _jsx(TableCell, {
                                    className:
                                      "max-w-xs truncate text-sm text-muted-foreground",
                                    children: alert.message,
                                  }),
                                  _jsx(TableCell, {
                                    className: "text-right",
                                    children: alert.acknowledgedAt
                                      ? _jsx("span", {
                                          className:
                                            "text-xs text-muted-foreground",
                                          children: "Acknowledged",
                                        })
                                      : _jsx(Button, {
                                          variant: "ghost",
                                          size: "sm",
                                          disabled: isAcknowledging,
                                          onClick: (e) =>
                                            handleAcknowledge(alert.id, e),
                                          children: "Acknowledge",
                                        }),
                                  }),
                                ],
                              },
                              alert.id,
                            ),
                          ),
                }),
              ],
            }),
          }),
          total > PAGE_SIZE &&
            _jsxs("div", {
              className: "flex items-center justify-between pt-3",
              children: [
                _jsxs("span", {
                  className: "text-sm text-muted-foreground",
                  children: [
                    "Page ",
                    currentPage,
                    " of ",
                    totalPages,
                    " (",
                    total.toLocaleString(APP_LOCALE),
                    " total)",
                  ],
                }),
                _jsxs("div", {
                  className: "flex gap-2",
                  children: [
                    _jsx(Button, {
                      variant: "outline",
                      size: "sm",
                      disabled: offset === 0,
                      onClick: () => setOffset(Math.max(0, offset - PAGE_SIZE)),
                      children: "Previous",
                    }),
                    _jsx(Button, {
                      variant: "outline",
                      size: "sm",
                      disabled: offset + PAGE_SIZE >= total,
                      onClick: () => setOffset(offset + PAGE_SIZE),
                      children: "Next",
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
      _jsx(ModelDetailDialog, {
        model: selectedModel,
        open: selectedModel !== null,
        onOpenChange: (v) => {
          if (!v) setSelectedModel(null);
        },
      }),
    ],
  });
}
