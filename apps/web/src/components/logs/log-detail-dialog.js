import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  MessageSquare,
  Timer,
  TrendingUp,
  Webhook,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
} from "../../lib/spend-log-utils";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CollapsibleSection } from "./log-detail-collapsible-section";
import { ContextBadge } from "./log-detail-context-badge";
import { LogDetailInfoSections } from "./log-detail-info-section";
import { JsonViewer } from "./log-detail-json-viewer";
import { MetricCard } from "./log-detail-metric-card";
export function LogDetailDialog({ log, open, onOpenChange }) {
  const [copied, setCopied] = useState(false);
  if (!log) return null;
  const durationMs =
    new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
  const tokensPerSec = calculateTokensPerSecond(
    log.completion_tokens,
    log.start_time,
    log.end_time,
  );
  const isSuccess = log.status === "200" || log.status === "success";
  const statusConfig = isSuccess
    ? {
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        badge: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      }
    : {
        icon: AlertCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
        badge: "bg-red-500/15 text-red-700 border-red-500/30",
      };
  const StatusIcon = statusConfig.icon;
  const handleCopyRequestId = async () => {
    await navigator.clipboard.writeText(log.request_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const contextBadges = [];
  if (log.call_type) {
    contextBadges.push({
      label: log.call_type.replace(/_/g, " ").replace(/\./g, " "),
      icon: MessageSquare,
      variant: "info",
    });
  }
  if (log.cache_hit) {
    contextBadges.push({
      label: log.cache_hit === "true" ? "Cache Hit" : "Cache Miss",
      icon: Zap,
      variant: log.cache_hit === "true" ? "success" : "warning",
    });
  }
  if (log.messages && log.messages.length > 0) {
    contextBadges.push({
      label: "Chat",
      icon: MessageSquare,
      variant: "purple",
    });
  }
  if (log.cache_hit || log.response) {
    contextBadges.push({
      label: "Streaming",
      icon: Webhook,
      variant: "cyan",
    });
  }
  const hasContextBadges = contextBadges.length > 0;
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "sm:max-w-6xl max-h-[90vh] overflow-y-auto",
      children: [
        _jsxs(DialogHeader, {
          className: "space-y-4",
          children: [
            _jsxs("div", {
              className: "flex flex-wrap items-center gap-3",
              children: [
                _jsx("div", {
                  className: `flex items-center justify-center w-10 h-10 rounded-full ${statusConfig.bg}`,
                  children: _jsx(StatusIcon, {
                    className: `w-5 h-5 ${statusConfig.color}`,
                  }),
                }),
                _jsxs("div", {
                  className: "flex-1 min-w-0",
                  children: [
                    _jsx(DialogTitle, {
                      className:
                        "font-mono text-sm sm:text-base break-all pr-4",
                      children: log.model,
                    }),
                    _jsxs(DialogDescription, {
                      className: "flex items-center gap-2 mt-1 flex-wrap",
                      children: [
                        _jsx("span", {
                          children: formatFullDateTime(log.start_time),
                        }),
                        _jsx("span", {
                          className: "text-muted-foreground/50",
                          children: "\u2022",
                        }),
                        _jsx("span", { children: formatDuration(durationMs) }),
                        log.call_type &&
                          _jsxs(_Fragment, {
                            children: [
                              _jsx("span", {
                                className: "text-muted-foreground/50",
                                children: "\u2022",
                              }),
                              _jsx("span", {
                                className: "capitalize",
                                children: log.call_type.replace(/_/g, " "),
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
                _jsx(Badge, {
                  variant: isSuccess ? "secondary" : "destructive",
                  className: statusConfig.badge,
                  children: log.status,
                }),
                _jsx(Badge, {
                  variant: "outline",
                  children: log.user || "anonymous",
                }),
              ],
            }),
            _jsxs("div", {
              className:
                "rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-3",
              children: [
                _jsx("span", {
                  className:
                    "text-xs text-muted-foreground uppercase tracking-wide shrink-0",
                  children: "Request ID",
                }),
                _jsx("span", {
                  className: "font-mono text-xs break-all flex-1",
                  children: log.request_id,
                }),
                _jsx("button", {
                  type: "button",
                  onClick: handleCopyRequestId,
                  className:
                    "shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors",
                  title: "Copy request ID",
                  children: copied
                    ? _jsx(CheckCircle2, {
                        className: "h-3.5 w-3.5 text-emerald-500",
                      })
                    : _jsx(Copy, { className: "h-3.5 w-3.5" }),
                }),
              ],
            }),
          ],
        }),
        hasContextBadges &&
          _jsx("div", {
            className: "flex flex-wrap gap-2",
            children: contextBadges.map((badge) =>
              _jsx(
                ContextBadge,
                {
                  label: badge.label,
                  icon: badge.icon,
                  variant: badge.variant,
                },
                badge.label,
              ),
            ),
          }),
        _jsxs("div", {
          className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
          children: [
            _jsx(MetricCard, {
              icon: DollarSign,
              label: "Total Spend",
              value: formatCurrency(log.spend),
              accent: "text-emerald-500",
            }),
            _jsx(MetricCard, {
              icon: Timer,
              label: "Duration",
              value: formatDuration(durationMs),
              accent: "text-blue-500",
            }),
            _jsx(MetricCard, {
              icon: Zap,
              label: "Total Tokens",
              value: formatNumber(log.total_tokens),
              accent: "text-amber-500",
            }),
            _jsx(MetricCard, {
              icon: TrendingUp,
              label: "Speed",
              value: `${tokensPerSec} tok/s`,
              accent: "text-purple-500",
            }),
            _jsx(MetricCard, {
              icon: Zap,
              label: "Time to First Token",
              value:
                log.time_to_first_token_ms != null
                  ? `${Math.round(log.time_to_first_token_ms)}ms`
                  : "-",
              accent:
                log.time_to_first_token_ms != null
                  ? log.time_to_first_token_ms < 500
                    ? "text-emerald-500"
                    : log.time_to_first_token_ms < 2000
                      ? "text-amber-500"
                      : "text-red-500"
                  : "text-muted-foreground",
            }),
          ],
        }),
        _jsxs("div", {
          className: "rounded-lg border overflow-hidden",
          children: [
            _jsx("div", {
              className:
                "bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
              children: "Token Breakdown",
            }),
            _jsxs("div", {
              className: "p-4",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-4 text-sm flex-wrap",
                  children: [
                    _jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx("div", {
                          className: "w-3 h-3 rounded-sm bg-blue-500",
                        }),
                        _jsx("span", {
                          className: "text-muted-foreground",
                          children: "Prompt",
                        }),
                        _jsx("span", {
                          className: "font-medium",
                          children: formatNumber(log.prompt_tokens),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx("div", {
                          className: "w-3 h-3 rounded-sm bg-amber-500",
                        }),
                        _jsx("span", {
                          className: "text-muted-foreground",
                          children: "Completion",
                        }),
                        _jsx("span", {
                          className: "font-medium",
                          children: formatNumber(log.completion_tokens),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className:
                        "ml-auto flex items-center gap-2 text-muted-foreground",
                      children: [
                        _jsx("span", { children: "Ratio" }),
                        _jsxs("span", {
                          className: "font-medium text-foreground",
                          children: [
                            log.prompt_tokens > 0
                              ? (
                                  log.completion_tokens / log.prompt_tokens
                                ).toFixed(2)
                              : "0.00",
                            ":1",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs("div", {
                  className:
                    "mt-3 h-2.5 rounded-full bg-muted overflow-hidden flex",
                  children: [
                    _jsx("div", {
                      className: "bg-blue-500 h-full transition-all",
                      style: {
                        width: `${
                          log.total_tokens > 0
                            ? (log.prompt_tokens / log.total_tokens) * 100
                            : 50
                        }%`,
                      },
                    }),
                    _jsx("div", {
                      className: "bg-amber-500 h-full transition-all",
                      style: {
                        width: `${
                          log.total_tokens > 0
                            ? (log.completion_tokens / log.total_tokens) * 100
                            : 50
                        }%`,
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        log.messages &&
          log.messages.length > 0 &&
          _jsx(CollapsibleSection, {
            title: `Messages (${log.messages.length})`,
            icon: MessageSquare,
            defaultOpen: true,
            children: _jsx("div", {
              className: "space-y-3",
              children: log.messages.map((msg, idx) =>
                _jsxs(
                  "div",
                  {
                    className: `rounded-lg border p-3 ${
                      msg.role === "user"
                        ? "bg-blue-500/5 border-blue-500/20"
                        : msg.role === "assistant"
                          ? "bg-green-500/5 border-green-500/20"
                          : msg.role === "system"
                            ? "bg-purple-500/5 border-purple-500/20"
                            : "bg-muted/50 border-border"
                    }`,
                    children: [
                      _jsx("div", {
                        className: "flex items-center gap-2 mb-1.5",
                        children: _jsx("span", {
                          className: `text-xs font-medium uppercase tracking-wide ${
                            msg.role === "user"
                              ? "text-blue-600 dark:text-blue-400"
                              : msg.role === "assistant"
                                ? "text-green-600 dark:text-green-400"
                                : msg.role === "system"
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-muted-foreground"
                          }`,
                          children: msg.role,
                        }),
                      }),
                      _jsx("p", {
                        className: "text-sm whitespace-pre-wrap",
                        children: msg.content,
                      }),
                    ],
                  },
                  idx,
                ),
              ),
            }),
          }),
        log.metadata &&
          Object.keys(log.metadata).length > 0 &&
          _jsx(CollapsibleSection, {
            title: "Metadata",
            icon: MessageSquare,
            defaultOpen: false,
            children: _jsx(JsonViewer, {
              data: log.metadata,
              defaultOpen: false,
            }),
          }),
        log.request_tags &&
          log.request_tags.length > 0 &&
          _jsx(CollapsibleSection, {
            title: "Request Tags",
            icon: Zap,
            defaultOpen: false,
            children: _jsx("div", {
              className: "flex flex-wrap gap-2",
              children: log.request_tags.map((tag, index) =>
                _jsx(Badge, { variant: "outline", children: tag }, index),
              ),
            }),
          }),
        log.proxy_server_request &&
          typeof log.proxy_server_request === "object" &&
          Object.keys(log.proxy_server_request).length > 0 &&
          _jsx(CollapsibleSection, {
            title: "Request Body",
            icon: MessageSquare,
            defaultOpen: false,
            children: _jsx(JsonViewer, {
              data: log.proxy_server_request,
              defaultOpen: false,
            }),
          }),
        isSuccess &&
          log.response &&
          typeof log.response === "object" &&
          Object.keys(log.response).length > 0 &&
          _jsx(CollapsibleSection, {
            title: "Response",
            icon: FileText,
            defaultOpen: false,
            children: _jsx(JsonViewer, {
              data: log.response,
              defaultOpen: false,
            }),
          }),
        !isSuccess &&
          _jsxs("section", {
            className: "overflow-hidden rounded-lg border border-red-500/30",
            children: [
              _jsxs("div", {
                className:
                  "border-b bg-red-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400 flex items-center gap-2",
                children: [
                  _jsx(AlertTriangle, { className: "h-4 w-4" }),
                  "Error Details",
                ],
              }),
              _jsxs("div", {
                className: "p-4 space-y-3",
                children: [
                  _jsx("div", {
                    className: "flex flex-wrap gap-2",
                    children: _jsx(Badge, {
                      className: "bg-red-500/15 text-red-700 border-red-500/30",
                      children: log.status,
                    }),
                  }),
                  _jsx("pre", {
                    className:
                      "text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded font-mono overflow-x-auto",
                    children: log.response
                      ? JSON.stringify(log.response, null, 2)
                      : "No error details available",
                  }),
                ],
              }),
            ],
          }),
        _jsx(LogDetailInfoSections, {
          log: log,
          statusConfig: statusConfig,
          durationMs: durationMs,
          tokensPerSec: tokensPerSec,
        }),
      ],
    }),
  });
}
