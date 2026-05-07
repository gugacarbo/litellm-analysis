import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatTimeRelative,
} from "../../lib/spend-log-utils";
import { Badge } from "../ui/badge";
export function renderLogCell({ log, columnKey }) {
  const durationMs =
    new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
  const isSuccess = log.status === "200" || log.status === "success";
  switch (columnKey) {
    case "time":
      return _jsxs("span", {
        className: "text-xs whitespace-nowrap text-muted-foreground",
        children: [
          DEBUG_LOCALE &&
            _jsxs("span", {
              className: "mr-2",
              children: [
                _jsxs("span", {
                  className: "text-amber-500",
                  children: ["[", new Date(log.start_time).toISOString(), "]"],
                }),
                " ",
                _jsxs("span", {
                  className: "text-blue-500",
                  children: [
                    "[local: ",
                    new Date(log.start_time).toLocaleString(),
                    "]",
                  ],
                }),
                " ",
              ],
            }),
          _jsx("span", { children: formatTimeRelative(log.start_time) }),
          DEBUG_LOCALE &&
            _jsxs("span", {
              className: "ml-2 text-red-500",
              children: ["tz=", APP_TIMEZONE],
            }),
        ],
      });
    case "model":
      return _jsx("span", {
        className: "font-mono text-xs font-medium break-all",
        children: log.model,
      });
    case "user":
      return _jsx("span", {
        className: "text-sm text-muted-foreground",
        children: log.user || "-",
      });
    case "promptTokens":
      return formatNumber(log.prompt_tokens);
    case "completionTokens":
      return formatNumber(log.completion_tokens);
    case "totalTokens":
      return _jsx("span", {
        className: "font-medium",
        children: formatNumber(log.total_tokens),
      });
    case "duration":
      return formatDuration(durationMs);
    case "timeToFirstToken":
      return log.time_to_first_token_ms === null
        ? "-"
        : formatNumber(Math.round(log.time_to_first_token_ms));
    case "tokensPerSecond":
      return calculateTokensPerSecond(
        log.completion_tokens,
        log.start_time,
        log.end_time,
      );
    case "spend":
      return _jsx("span", {
        className: "font-medium",
        children: formatCurrency(log.spend),
      });
    case "status":
      return _jsx(Badge, {
        variant: isSuccess ? "secondary" : "destructive",
        className: isSuccess
          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
          : "",
        children: log.status,
      });
    case "requestId":
      return _jsx("span", {
        className: "font-mono text-xs text-muted-foreground break-all",
        children: log.request_id,
      });
    case "latencyHeat": {
      const startTime = new Date(log.start_time).getTime();
      const endTime = log.end_time
        ? new Date(log.end_time).getTime()
        : startTime;
      const durationMs = endTime - startTime;
      const durationSec = durationMs / 1000;
      let barColor = "bg-emerald-500";
      if (durationSec >= 5) {
        barColor = "bg-red-500";
      } else if (durationSec >= 1) {
        barColor = "bg-amber-500";
      }
      const maxWidth = 100;
      const barWidth = Math.min(maxWidth, (durationSec / 10) * maxWidth);
      return _jsxs("div", {
        className: "flex items-center gap-2 justify-end",
        children: [
          _jsx("div", {
            className: "w-20 h-2 rounded-full bg-muted overflow-hidden",
            children: _jsx("div", {
              className: `h-full rounded-full transition-all ${barColor}`,
              style: { width: `${barWidth}%` },
            }),
          }),
          _jsx("span", {
            className:
              "text-xs text-muted-foreground tabular-nums w-14 text-right",
            children: formatDuration(durationMs),
          }),
        ],
      });
    }
  }
}

import { APP_TIMEZONE, DEBUG_LOCALE } from "@/lib/locale";
