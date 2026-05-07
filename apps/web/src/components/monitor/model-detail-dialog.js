import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { HealthStatusBadge } from "./health-status-badge";

function getSuccessRateColor(rate) {
  if (rate >= 95) return "text-green-600";
  if (rate >= 90) return "text-amber-600";
  return "text-red-600";
}
function getErrorBarColor(rate) {
  if (rate > 20) return "bg-red-500";
  if (rate > 10) return "bg-amber-500";
  return "bg-green-500";
}
export function ModelDetailDialog({ model, open, onOpenChange }) {
  if (model == null) return null;
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "max-w-md",
      children: [
        _jsx(DialogHeader, {
          children: _jsx(DialogTitle, {
            className: "truncate",
            children: model.model,
          }),
        }),
        _jsxs("div", {
          className: "space-y-3",
          children: [
            _jsxs("div", {
              className: "flex items-center justify-between gap-2",
              children: [
                _jsx(HealthStatusBadge, { status: model.status }),
                _jsxs("span", {
                  className: "text-xs text-muted-foreground",
                  children: [model.error_rate_1h.toFixed(1), "% errors"],
                }),
              ],
            }),
            _jsx("div", {
              className: "h-2 rounded-full bg-muted",
              children: _jsx("div", {
                className: cn(
                  "h-2 rounded-full transition-all",
                  getErrorBarColor(model.error_rate_1h),
                ),
                style: {
                  width: `${Math.min(model.error_rate_1h, 100)}%`,
                },
              }),
            }),
            model.stats != null
              ? _jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-[10px] text-muted-foreground",
                          children: "Success Rate",
                        }),
                        _jsx("p", {
                          className: cn(
                            "text-lg font-semibold",
                            model.stats.total_requests > 0
                              ? getSuccessRateColor(
                                  (model.stats.success_count /
                                    model.stats.total_requests) *
                                    100,
                                )
                              : "text-muted-foreground",
                          ),
                          children:
                            model.stats.total_requests > 0
                              ? `${((model.stats.success_count / model.stats.total_requests) * 100).toFixed(1)}%`
                              : "—",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-[10px] text-muted-foreground",
                          children: "Requests (1h)",
                        }),
                        _jsx("p", {
                          className: "text-lg font-semibold",
                          children:
                            model.stats.total_requests.toLocaleString(
                              APP_LOCALE,
                            ),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-[10px] text-muted-foreground",
                          children: "P95 Latency",
                        }),
                        _jsx("p", {
                          className: "text-lg font-semibold",
                          children:
                            model.stats.p95_latency_ms != null
                              ? `${model.stats.p95_latency_ms.toFixed(0)}ms`
                              : "—",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-[10px] text-muted-foreground",
                          children: "Avg Latency",
                        }),
                        _jsx("p", {
                          className: "text-lg font-semibold",
                          children:
                            model.stats.avg_latency_ms != null
                              ? `${model.stats.avg_latency_ms.toFixed(0)}ms`
                              : "—",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-[10px] text-muted-foreground",
                          children: "Errors",
                        }),
                        _jsx("p", {
                          className: "text-lg font-semibold",
                          children:
                            model.stats.error_count.toLocaleString(APP_LOCALE),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-[10px] text-muted-foreground",
                          children: "Last Activity",
                        }),
                        _jsx("p", {
                          className: "truncate text-sm font-medium",
                          children: model.stats.last_success_at
                            ? new Date(
                                model.stats.last_success_at,
                              ).toLocaleString(APP_LOCALE, {
                                timeZone: APP_TIMEZONE,
                              })
                            : "—",
                        }),
                      ],
                    }),
                  ],
                })
              : _jsx("p", {
                  className: "text-xs text-muted-foreground",
                  children: "Detailed stats available once WebSocket connects.",
                }),
          ],
        }),
      ],
    }),
  });
}
