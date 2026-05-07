import { Loader2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../../pages/health-status/health-status-utils";
import { Button } from "../ui/button";
import { StatusBadge } from "./status-badge";
export function ModelsTable({
  models,
  isLoading,
  isError,
  isGlobalRunning,
  isModelRunning,
  onSelect,
  onTest,
}) {
  if (isLoading) {
    return _jsx("div", {
      className: "py-8 text-center text-sm text-muted-foreground",
      children: _jsxs("div", {
        className: "flex items-center justify-center gap-2",
        children: [
          _jsx(Loader2, { className: "size-4 animate-spin" }),
          "Loading latest checks...",
        ],
      }),
    });
  }
  if (isError) {
    return _jsx("div", {
      className: "py-8 text-center text-sm text-destructive",
      children: "Failed to load latest health check results.",
    });
  }
  if (models.length === 0) {
    return _jsx("div", {
      className: "py-8 text-center text-sm text-muted-foreground",
      children: "No models configured.",
    });
  }
  return _jsx("div", {
    className: "overflow-hidden rounded-md border",
    children: _jsxs("table", {
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
                  "h-9 w-[170px] px-3 text-start text-xs font-medium text-muted-foreground",
                children: "Latency / HTTP",
              }),
              _jsx("th", {
                className:
                  "h-9 w-[180px] px-3 text-start text-xs font-medium text-muted-foreground",
                children: "TTFT / Tokens/s",
              }),
              _jsx("th", {
                className:
                  "h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground",
                children: "Last Check",
              }),
              _jsx("th", {
                className:
                  "h-9 w-[80px] px-3 text-center text-xs font-medium text-muted-foreground",
                children: "Test",
              }),
            ],
          }),
        }),
        _jsx("tbody", {
          children: models.map((model) => {
            const modelIsRunning = isModelRunning(model.modelName);
            const isIndividualButtonDisabled =
              isGlobalRunning || modelIsRunning;
            const displayStatus = isIndividualButtonDisabled
              ? "checking"
              : model.status;
            return _jsxs(
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
                      onClick: () => onSelect(model),
                      children: _jsx(StatusBadge, { status: displayStatus }),
                    }),
                  }),
                  _jsx("td", {
                    className: "max-w-[260px] truncate px-3 py-2 font-medium",
                    children: model.modelName,
                  }),
                  _jsx("td", {
                    className: "px-3 py-2",
                    children: _jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx("span", {
                          className: "font-mono text-xs tabular-nums",
                          children: formatResponseTime(model.responseTimeMs),
                        }),
                        _jsx("span", {
                          className:
                            "text-[10px] text-muted-foreground tabular-nums",
                          children: model.statusCode ?? "—",
                        }),
                      ],
                    }),
                  }),
                  _jsx("td", {
                    className: "px-3 py-2",
                    children: _jsxs("div", {
                      className: "flex flex-col gap-0.5",
                      children: [
                        _jsx("span", {
                          className: "font-mono text-xs tabular-nums",
                          children: formatResponseTime(model.ttftMs),
                        }),
                        _jsx("span", {
                          className:
                            "font-mono text-[10px] text-muted-foreground tabular-nums",
                          children: formatTokensPerSecond(
                            model.tokensPerSecond,
                          ),
                        }),
                      ],
                    }),
                  }),
                  _jsx("td", {
                    className: "px-3 py-2 text-xs text-muted-foreground",
                    children: model.checkedAt
                      ? _jsx("span", {
                          title: formatTimestamp(model.checkedAt),
                          children: formatRelativeTime(model.checkedAt),
                        })
                      : "—",
                  }),
                  _jsx("td", {
                    className: "px-3 py-2 text-center",
                    children: _jsx(Button, {
                      size: "sm",
                      variant: "ghost",
                      className: "h-7 px-2 text-xs",
                      onClick: () => onTest(model.modelName),
                      disabled: isIndividualButtonDisabled,
                      children: "Test",
                    }),
                  }),
                ],
              },
              model.modelName,
            );
          }),
        }),
      ],
    }),
  });
}
