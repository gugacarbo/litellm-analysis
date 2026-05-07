import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatNumber,
  formatTimeRelative,
} from "../../lib/spend-log-utils";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
export function renderGroupSummaryCell({ model, groupLogs, summary, column }) {
  if (column.key === "actions") {
    return null;
  }
  if (column.key === "time") {
    return _jsxs("span", {
      className: "text-xs whitespace-nowrap text-muted-foreground",
      children: [
        formatTimeRelative(groupLogs[0].start_time),
        " \u2014",
        " ",
        formatTimeRelative(groupLogs[groupLogs.length - 1].start_time),
      ],
    });
  }
  if (column.key === "model") {
    return _jsxs("div", {
      className: "flex items-center gap-2",
      children: [
        _jsx(Badge, {
          variant: "secondary",
          className: "font-semibold",
          children: model,
        }),
        _jsxs("span", {
          className: "text-sm text-muted-foreground",
          children: ["\u00D7", groupLogs.length],
        }),
      ],
    });
  }
  if (column.key === "user") {
    const uniqueUsers = new Set(groupLogs.map((l) => l.user));
    if (uniqueUsers.size > 1) {
      return _jsxs("span", {
        className: "text-sm text-muted-foreground",
        children: [uniqueUsers.size, " users"],
      });
    }
    return _jsx("span", {
      className: "text-sm text-muted-foreground",
      children: groupLogs[0].user || "—",
    });
  }
  if (column.key === "promptTokens") {
    return _jsx("span", {
      className: "text-right",
      children: formatNumber(summary.totalPromptTokens),
    });
  }
  if (column.key === "completionTokens") {
    return _jsx("span", {
      className: "text-right",
      children: formatNumber(summary.totalCompletionTokens),
    });
  }
  if (column.key === "totalTokens") {
    return _jsx("span", {
      className: "text-right font-medium",
      children: formatNumber(summary.totalTokens),
    });
  }
  if (column.key === "duration") {
    return _jsx("span", {
      className: "text-right",
      children: summary.totalDurationMs.toLocaleString(),
    });
  }
  if (column.key === "timeToFirstToken") {
    return _jsx("span", {
      className: cn(
        "text-right",
        summary.averageTimeToFirstTokenMs === null
          ? "text-muted-foreground"
          : "",
      ),
      children:
        summary.averageTimeToFirstTokenMs === null
          ? "-"
          : formatNumber(Math.round(summary.averageTimeToFirstTokenMs)),
    });
  }
  if (column.key === "tokensPerSecond") {
    return _jsx("span", {
      className: cn(
        "text-right",
        summary.averageTokensPerSecond === null ? "text-muted-foreground" : "",
      ),
      children:
        summary.averageTokensPerSecond === null
          ? "-"
          : `${summary.averageTokensPerSecond.toFixed(1)}/s`,
    });
  }
  if (column.key === "spend") {
    return _jsx("span", {
      className: "text-right font-medium",
      children: formatCurrency(summary.totalSpend),
    });
  }
  if (column.key === "status") {
    return _jsx(Badge, {
      variant: summary.groupStatus === "error" ? "destructive" : "secondary",
      className:
        summary.groupStatus === "success"
          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
          : summary.groupStatus === "partial"
            ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
            : "",
      children: summary.groupStatus,
    });
  }
  return null;
}
