import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Key,
  Shield,
  Tag,
  Timer,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatDuration,
  formatFullDateTime,
  maskApiKey,
} from "../../lib/spend-log-utils";
import { Badge } from "../ui/badge";
import { CollapsibleSection } from "./log-detail-collapsible-section";
import { ContextBadge } from "./log-detail-context-badge";

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  copyable = false,
  copyValue,
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (copyValue) {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return _jsxs("div", {
    className: "grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5",
    children: [
      _jsxs("dt", {
        className: "flex items-center gap-2 text-xs text-muted-foreground",
        children: [_jsx(Icon, { className: "h-3.5 w-3.5 shrink-0" }), label],
      }),
      _jsxs("dd", {
        className: `text-sm font-medium break-words flex items-center gap-2 ${mono ? "font-mono text-xs" : ""}`,
        children: [
          _jsx("span", { className: "flex-1", children: value }),
          copyable &&
            copyValue &&
            _jsx("button", {
              type: "button",
              onClick: handleCopy,
              className:
                "shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors",
              title: "Copy to clipboard",
              children: copied
                ? _jsx(CheckCircle2, {
                    className: "h-3.5 w-3.5 text-emerald-500",
                  })
                : _jsx(Copy, { className: "h-3.5 w-3.5" }),
            }),
        ],
      }),
    ],
  });
}
export function LogDetailInfoSections({
  log,
  statusConfig,
  durationMs,
  tokensPerSec,
}) {
  const isSuccess = log.status === "200" || log.status === "success";
  const additionalFields = [];
  if (log.team_id) {
    additionalFields.push({
      label: "Team ID",
      value: log.team_id,
      icon: Users,
    });
  }
  if (log.end_user) {
    additionalFields.push({
      label: "End User",
      value: log.end_user,
      icon: User,
    });
  }
  if (log.requester_ip_address) {
    additionalFields.push({
      label: "IP Address",
      value: log.requester_ip_address,
      icon: Globe,
    });
  }
  if (log.session_id) {
    additionalFields.push({
      label: "Session ID",
      value: log.session_id,
      icon: Shield,
    });
  }
  if (log.agent_id) {
    additionalFields.push({
      label: "Agent ID",
      value: log.agent_id,
      icon: Zap,
    });
  }
  if (log.organization_id) {
    additionalFields.push({
      label: "Organization",
      value: log.organization_id,
      icon: Shield,
    });
  }
  if (log.request_duration_ms != null) {
    additionalFields.push({
      label: "Req Duration",
      value: `${log.request_duration_ms}ms`,
      icon: Timer,
    });
  }
  if (log.custom_llm_provider) {
    additionalFields.push({
      label: "Provider",
      value: log.custom_llm_provider,
      icon: Globe,
    });
  }
  if (log.api_base) {
    additionalFields.push({
      label: "API Base",
      value: log.api_base,
      icon: Globe,
    });
  }
  if (log.model_id) {
    additionalFields.push({
      label: "Model ID",
      value: log.model_id,
      icon: Tag,
    });
  }
  if (log.model_group) {
    additionalFields.push({
      label: "Model Group",
      value: log.model_group,
      icon: Tag,
    });
  }
  const hasAdditionalFields = additionalFields.length > 0;
  return _jsxs("div", {
    className: "grid gap-4 lg:grid-cols-2",
    children: [
      _jsxs("section", {
        className: "overflow-hidden rounded-lg border",
        children: [
          _jsx("div", {
            className:
              "border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
            children: "Request Info",
          }),
          _jsxs("dl", {
            className: "divide-y divide-border",
            children: [
              _jsx(DetailRow, {
                icon: User,
                label: "User",
                value: log.user || "N/A",
              }),
              _jsx(DetailRow, {
                icon: Key,
                label: "Model",
                value: log.model,
                mono: true,
              }),
              _jsx(DetailRow, {
                icon: Key,
                label: "API Key",
                value: maskApiKey(log.api_key),
                mono: true,
                copyable: true,
                copyValue: log.api_key,
              }),
              _jsx(DetailRow, {
                icon: isSuccess ? CheckCircle2 : AlertCircle,
                label: "Status",
                value: _jsx(Badge, {
                  variant: isSuccess ? "secondary" : "destructive",
                  className: statusConfig.badge,
                  children: log.status,
                }),
              }),
              log.call_type &&
                _jsx(DetailRow, {
                  icon: Tag,
                  label: "Call Type",
                  value: _jsx(ContextBadge, {
                    label: log.call_type.replace(/_/g, " ").replace(/\./g, " "),
                    variant: "info",
                  }),
                }),
              log.cache_hit &&
                _jsx(DetailRow, {
                  icon: Zap,
                  label: "Cache",
                  value: _jsx(ContextBadge, {
                    label:
                      log.cache_hit === "true" ? "Cache Hit" : "Cache Miss",
                    variant: log.cache_hit === "true" ? "success" : "warning",
                  }),
                }),
              hasAdditionalFields &&
                _jsx(CollapsibleSection, {
                  title: "Additional Details",
                  icon: Shield,
                  defaultOpen: false,
                  children: _jsx("dl", {
                    className: "divide-y divide-border -my-2",
                    children: additionalFields.map((field) =>
                      _jsx(
                        DetailRow,
                        {
                          icon: field.icon,
                          label: field.label,
                          value: field.value,
                          mono: field.label !== "End User",
                          copyable: [
                            "Team ID",
                            "Session ID",
                            "Agent ID",
                            "Organization",
                          ].includes(field.label),
                          copyValue: field.value,
                        },
                        field.label,
                      ),
                    ),
                  }),
                }),
            ],
          }),
        ],
      }),
      _jsxs("section", {
        className: "overflow-hidden rounded-lg border",
        children: [
          _jsx("div", {
            className:
              "border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
            children: "Timing Details",
          }),
          _jsxs("dl", {
            className: "divide-y divide-border",
            children: [
              _jsx(DetailRow, {
                icon: Clock,
                label: "Start Time",
                value: formatFullDateTime(log.start_time),
              }),
              _jsx(DetailRow, {
                icon: Clock,
                label: "End Time",
                value: formatFullDateTime(log.end_time),
              }),
              _jsx(DetailRow, {
                icon: Timer,
                label: "Duration",
                value: formatDuration(durationMs),
              }),
              _jsx(DetailRow, {
                icon: TrendingUp,
                label: "Tokens/Second",
                value: tokensPerSec,
              }),
              _jsx(DetailRow, {
                icon: Zap,
                label: "Time to 1st Token",
                value:
                  log.time_to_first_token_ms != null
                    ? `${Math.round(log.time_to_first_token_ms)}ms`
                    : "-",
              }),
              log.completion_start_time &&
                _jsx(DetailRow, {
                  icon: Clock,
                  label: "Completion Start",
                  value: formatFullDateTime(log.completion_start_time),
                }),
              log.request_duration_ms != null &&
                _jsx(DetailRow, {
                  icon: Timer,
                  label: "Request Duration",
                  value: `${log.request_duration_ms}ms`,
                }),
            ],
          }),
        ],
      }),
    ],
  });
}
