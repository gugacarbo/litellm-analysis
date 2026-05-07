import { MessageSquareText } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../../pages/health-status/health-status-utils";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { StatusBadge } from "./status-badge";

function formatPayload(payload) {
  if (!payload) return "No payload";
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}
export function StatusDetailsDialog({ selected }) {
  if (!selected) return null;
  return _jsxs(DialogContent, {
    className: "max-h-[85vh] max-w-2xl overflow-auto",
    children: [
      _jsxs(DialogHeader, {
        className: "flex flex-row items-start justify-between gap-4",
        children: [
          _jsxs("div", {
            children: [
              _jsxs(DialogTitle, {
                className: "flex items-center gap-2",
                children: [
                  "Status Details",
                  _jsx(StatusBadge, { status: selected.status }),
                ],
              }),
              _jsx(DialogDescription, { children: selected.modelName }),
            ],
          }),
          _jsxs("div", {
            className: "pt-0.5 text-right",
            children: [
              _jsx("div", {
                className:
                  "text-[11px] uppercase tracking-wide text-muted-foreground",
                children: "Last check",
              }),
              selected.checkedAt
                ? _jsxs("div", {
                    className: "mt-0.5 space-y-0.5",
                    children: [
                      _jsx("div", {
                        className: "text-xs",
                        children: formatTimestamp(selected.checkedAt),
                      }),
                      _jsx("div", {
                        className: "text-[11px] text-muted-foreground",
                        children: formatRelativeTime(selected.checkedAt),
                      }),
                    ],
                  })
                : _jsx("div", {
                    className: "mt-0.5 text-xs",
                    children: "\u2014",
                  }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-3 text-sm",
        children: [
          _jsxs("div", {
            className: "grid grid-cols-2 gap-3 md:grid-cols-3",
            children: [
              _jsxs("div", {
                className: "rounded-md border bg-muted/20 p-3",
                children: [
                  _jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "Latency",
                  }),
                  _jsx("div", {
                    className: "mt-1 font-mono text-sm",
                    children: formatResponseTime(selected.responseTimeMs),
                  }),
                ],
              }),
              _jsxs("div", {
                className: "rounded-md border bg-muted/20 p-3",
                children: [
                  _jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "TTFT",
                  }),
                  _jsx("div", {
                    className: "mt-1 font-mono text-sm",
                    children: formatResponseTime(selected.ttftMs),
                  }),
                ],
              }),
              _jsxs("div", {
                className: "rounded-md border bg-muted/20 p-3",
                children: [
                  _jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "Tokens/s",
                  }),
                  _jsx("div", {
                    className: "mt-1 font-mono text-sm",
                    children: formatTokensPerSecond(selected.tokensPerSecond),
                  }),
                ],
              }),
              _jsxs("div", {
                className: "rounded-md border bg-muted/20 p-3",
                children: [
                  _jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "Output tokens",
                  }),
                  _jsx("div", {
                    className: "mt-1 font-mono text-sm tabular-nums",
                    children: selected.outputTokens ?? "—",
                  }),
                ],
              }),
              _jsxs("div", {
                className: "rounded-md border bg-muted/20 p-3",
                children: [
                  _jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "HTTP",
                  }),
                  _jsx("div", {
                    className: "mt-1 font-mono text-sm",
                    children: selected.statusCode ?? "—",
                  }),
                ],
              }),
              _jsxs("div", {
                className: "rounded-md border bg-muted/20 p-3",
                children: [
                  _jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "Source",
                  }),
                  _jsx("div", {
                    className: "mt-1 font-mono text-sm uppercase",
                    children: selected.source ?? "—",
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "rounded-md border bg-muted/20 p-3",
            children: [
              _jsx("div", {
                className: "mb-1 text-xs text-muted-foreground",
                children: "Prompt sent",
              }),
              _jsx("div", {
                className:
                  "max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs",
                children: selected.promptSent ?? "No prompt",
              }),
            ],
          }),
          _jsxs("div", {
            className: "rounded-md border bg-muted/20 p-3",
            children: [
              _jsx("div", {
                className: "mb-1 text-xs text-muted-foreground",
                children: "Response received",
              }),
              _jsx("pre", {
                className:
                  "max-h-52 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs",
                children: formatPayload(selected.responseReceived),
              }),
            ],
          }),
          _jsxs("div", {
            className: "rounded-md border bg-muted/20 p-3",
            children: [
              _jsx("div", {
                className: "mb-1 text-xs text-muted-foreground",
                children: "Request payload",
              }),
              _jsx("pre", {
                className:
                  "max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs",
                children: formatPayload(selected.requestPayload),
              }),
            ],
          }),
          _jsxs("div", {
            className: "rounded-md border bg-muted/20 p-3",
            children: [
              _jsx("div", {
                className: "mb-1 text-xs text-muted-foreground",
                children: "Full response payload",
              }),
              _jsx("pre", {
                className:
                  "max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs",
                children: formatPayload(selected.responsePayload),
              }),
            ],
          }),
          _jsxs("div", {
            className: "rounded-md border bg-muted/20 p-3",
            children: [
              _jsxs("div", {
                className:
                  "mb-1 flex items-center gap-1 text-xs text-muted-foreground",
                children: [
                  _jsx(MessageSquareText, { className: "size-3.5" }),
                  "Error message",
                ],
              }),
              _jsx("div", {
                className:
                  "max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-xs",
                children: selected.errorMessage ?? "No error",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
