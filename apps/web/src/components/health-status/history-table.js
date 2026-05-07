import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../../pages/health-status/health-status-utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { StatusBadge } from "./status-badge";
export function HistoryTable({
  entries,
  isLoading,
  isError,
  total,
  offset,
  page,
  totalPages,
  start,
  end,
  onSelect,
  onPrevPage,
  onNextPage,
}) {
  if (isLoading) {
    return _jsx("div", {
      className: "py-8 text-center text-sm text-muted-foreground",
      children: _jsxs("div", {
        className: "flex items-center justify-center gap-2",
        children: [
          _jsx(Loader2, { className: "size-4 animate-spin" }),
          "Loading history...",
        ],
      }),
    });
  }
  if (isError) {
    return _jsx("div", {
      className: "py-8 text-center text-sm text-destructive",
      children: "Failed to load health check history.",
    });
  }
  if (entries.length === 0) {
    return _jsx("div", {
      className: "py-8 text-center text-sm text-muted-foreground",
      children: "No history available.",
    });
  }
  return _jsxs("div", {
    className: "overflow-hidden rounded-md border",
    children: [
      _jsxs("table", {
        className: "w-full text-sm",
        children: [
          _jsx("thead", {
            children: _jsxs("tr", {
              className: "border-b bg-muted/30",
              children: [
                _jsx("th", {
                  className:
                    "h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "Status",
                }),
                _jsx("th", {
                  className:
                    "h-9 px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "Model",
                }),
                _jsx("th", {
                  className:
                    "h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "Latency",
                }),
                _jsx("th", {
                  className:
                    "h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "TTFT",
                }),
                _jsx("th", {
                  className:
                    "h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "Tokens/s",
                }),
                _jsx("th", {
                  className:
                    "h-9 w-[90px] px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "HTTP",
                }),
                _jsx("th", {
                  className:
                    "h-9 w-[100px] px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "Source",
                }),
                _jsx("th", {
                  className:
                    "h-9 px-3 text-start text-xs font-medium text-muted-foreground",
                  children: "When",
                }),
              ],
            }),
          }),
          _jsx("tbody", {
            children: entries.map((entry) =>
              _jsxs(
                "tr",
                {
                  className:
                    "border-b transition-colors hover:bg-muted/20 last:border-0",
                  children: [
                    _jsx("td", {
                      className: "px-3 py-2",
                      children: _jsx("button", {
                        type: "button",
                        className: "rounded",
                        onClick: () => onSelect(entry),
                        children: _jsx(StatusBadge, { status: entry.status }),
                      }),
                    }),
                    _jsx("td", {
                      className: "max-w-[260px] truncate px-3 py-2 font-medium",
                      children: entry.modelName,
                    }),
                    _jsx("td", {
                      className: "px-3 py-2 font-mono text-xs tabular-nums",
                      children: formatResponseTime(entry.responseTimeMs),
                    }),
                    _jsx("td", {
                      className: "px-3 py-2 font-mono text-xs tabular-nums",
                      children: formatResponseTime(entry.ttftMs),
                    }),
                    _jsx("td", {
                      className: "px-3 py-2 font-mono text-xs tabular-nums",
                      children: formatTokensPerSecond(entry.tokensPerSecond),
                    }),
                    _jsx("td", {
                      className: "px-3 py-2 text-xs tabular-nums",
                      children: entry.statusCode ?? "—",
                    }),
                    _jsx("td", {
                      className: "px-3 py-2",
                      children: _jsx(Badge, {
                        variant: "outline",
                        className: "px-1.5 py-0 text-[10px]",
                        children: entry.source,
                      }),
                    }),
                    _jsx("td", {
                      className: "px-3 py-2 text-xs text-muted-foreground",
                      title: formatTimestamp(entry.checkedAt),
                      children: formatRelativeTime(entry.checkedAt),
                    }),
                  ],
                },
                entry.id,
              ),
            ),
          }),
        ],
      }),
      _jsxs("div", {
        className:
          "flex items-center justify-between border-t bg-muted/20 px-3 py-2",
        children: [
          _jsxs("span", {
            className: "text-xs text-muted-foreground tabular-nums",
            children: ["Showing ", start, "\u2013", end, " of ", total],
          }),
          _jsxs("div", {
            className: "flex items-center gap-1",
            children: [
              _jsxs(Button, {
                size: "sm",
                variant: "ghost",
                className: "h-7 px-2 text-xs",
                disabled: offset === 0,
                onClick: onPrevPage,
                children: [
                  _jsx(ChevronLeft, { className: "size-3.5" }),
                  "Prev",
                ],
              }),
              _jsxs("span", {
                className: "px-1 text-xs tabular-nums",
                children: [page, " / ", totalPages],
              }),
              _jsxs(Button, {
                size: "sm",
                variant: "ghost",
                className: "h-7 px-2 text-xs",
                disabled: end >= total,
                onClick: onNextPage,
                children: [
                  "Next",
                  _jsx(ChevronRight, { className: "size-3.5" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
