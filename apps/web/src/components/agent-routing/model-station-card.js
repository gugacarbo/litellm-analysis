import { ChevronRight, Globe, Hash, Palette, Users, Zap } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
  getHealthLevel,
  getModelColor,
  MODEL_HEALTH_COLORS,
} from "./model-stations-utils";

const MAX_VISIBLE_ENTITIES = 3;
export function ModelStationCard({
  modelName,
  entities,
  totalFallbacks,
  stats,
  onOpenEntityConfig,
}) {
  const color = getModelColor(modelName);
  const visibleEntities = entities.slice(0, MAX_VISIBLE_ENTITIES);
  const remainingCount = entities.length - MAX_VISIBLE_ENTITIES;
  const healthLevel = stats
    ? getHealthLevel(stats.success_rate, stats.error_count)
    : null;
  const healthColors = healthLevel ? MODEL_HEALTH_COLORS[healthLevel] : null;
  return _jsxs("div", {
    className: cn(
      "group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-black/5",
      color.bg,
      color.border,
    ),
    children: [
      _jsx("div", {
        className:
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30",
      }),
      _jsx("div", {
        className: cn(
          "absolute -right-8 -bottom-8 size-32 rounded-full blur-3xl",
          color.dot,
          "opacity-15 transition-opacity duration-300 group-hover:opacity-25",
        ),
      }),
      _jsxs("div", {
        className: "relative p-4",
        children: [
          _jsxs("div", {
            className: "mb-4 flex items-start justify-between gap-2",
            children: [
              _jsxs("div", {
                className: "min-w-0 flex-1",
                children: [
                  _jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      _jsx("div", {
                        className: cn(
                          "size-2.5 shrink-0 rounded-full",
                          color.dot,
                        ),
                      }),
                      _jsx("p", {
                        className: cn(
                          "truncate font-mono text-base font-bold tracking-tight",
                          color.text,
                        ),
                        children: modelName,
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "mt-1.5 flex items-center gap-2",
                    children: [
                      _jsxs("span", {
                        className: "text-xs text-muted-foreground",
                        children: [
                          entities.length,
                          " ",
                          entities.length === 1 ? "entity" : "entities",
                        ],
                      }),
                      healthColors &&
                        _jsxs(Tooltip, {
                          children: [
                            _jsx(TooltipTrigger, {
                              asChild: true,
                              children: _jsxs("div", {
                                className: cn(
                                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  healthColors.bg,
                                  healthColors.text,
                                ),
                                children: [
                                  _jsx("div", {
                                    className: cn(
                                      "size-1.5 rounded-full",
                                      healthColors.dot,
                                    ),
                                  }),
                                  formatPercent(stats?.success_rate ?? null),
                                ],
                              }),
                            }),
                            _jsxs(TooltipContent, {
                              children: [
                                _jsxs("p", {
                                  children: [
                                    "Health: ",
                                    healthLevel,
                                    " | Success rate:",
                                    " ",
                                    formatPercent(stats?.success_rate ?? null),
                                  ],
                                }),
                                stats &&
                                  _jsxs("p", {
                                    className: "text-muted-foreground",
                                    children: [
                                      stats.error_count,
                                      " error",
                                      stats.error_count !== 1 ? "s" : "",
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        }),
                    ],
                  }),
                ],
              }),
              stats &&
                _jsxs("div", {
                  className: "flex flex-wrap justify-end gap-1",
                  children: [
                    _jsx(StatPill, {
                      icon: _jsx(Zap, { className: "h-3 w-3" }),
                      value: formatCompactNumber(stats.request_count),
                      tooltip: `${stats.request_count} requests`,
                    }),
                    _jsx(StatPill, {
                      icon: _jsx("span", {
                        className: "text-xs",
                        children: "$",
                      }),
                      value: formatCurrency(stats.total_spend),
                      tooltip: `$${stats.total_spend.toFixed(4)} total spend`,
                    }),
                  ],
                }),
            ],
          }),
          _jsxs("div", {
            className: "mb-3 space-y-1.5",
            children: [
              visibleEntities.map((entity) =>
                _jsxs(
                  "div",
                  {
                    className:
                      "flex items-center justify-between rounded-lg bg-background/70 px-2.5 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-background/90",
                    children: [
                      _jsxs("div", {
                        className: "flex items-center gap-2 min-w-0",
                        children: [
                          entity.icon &&
                            _jsx("span", {
                              className: "text-sm",
                              children: entity.icon,
                            }),
                          _jsx("span", {
                            className: "truncate font-medium",
                            children: entity.name,
                          }),
                        ],
                      }),
                      _jsx(Button, {
                        variant: "ghost",
                        size: "icon-sm",
                        className:
                          "h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                        onClick: () => onOpenEntityConfig(entity.key),
                        children: _jsx(Palette, { className: "h-3 w-3" }),
                      }),
                    ],
                  },
                  entity.key,
                ),
              ),
              remainingCount > 0 &&
                _jsx("div", {
                  className: "py-0.5 text-center",
                  children: _jsxs("span", {
                    className: "text-xs text-muted-foreground",
                    children: ["+", remainingCount, " more"],
                  }),
                }),
            ],
          }),
          stats &&
            _jsxs("div", {
              className:
                "mb-3 grid grid-cols-3 gap-2 rounded-lg bg-background/50 p-2 backdrop-blur-sm",
              children: [
                _jsx(MetricItem, {
                  icon: _jsx(Hash, {
                    className: "h-3 w-3 text-muted-foreground",
                  }),
                  label: "Tokens",
                  value: formatCompactNumber(stats.total_tokens),
                }),
                _jsx(MetricItem, {
                  icon: _jsx(Zap, {
                    className: "h-3 w-3 text-muted-foreground",
                  }),
                  label: "Latency",
                  value: formatDuration(stats.avg_latency_ms),
                }),
                _jsx(MetricItem, {
                  icon: _jsx(Users, {
                    className: "h-3 w-3 text-muted-foreground",
                  }),
                  label: "Users",
                  value: formatCompactNumber(stats.unique_users),
                }),
              ],
            }),
          _jsxs("div", {
            className: "flex items-center justify-between",
            children: [
              totalFallbacks > 0 &&
                _jsxs("div", {
                  className:
                    "flex items-center gap-1.5 text-xs text-muted-foreground",
                  children: [
                    _jsx(ChevronRight, { className: "h-3 w-3" }),
                    _jsxs("span", {
                      children: [
                        totalFallbacks,
                        " fallback",
                        totalFallbacks === 1 ? "" : "s",
                      ],
                    }),
                  ],
                }),
              stats &&
                _jsxs("div", {
                  className:
                    "flex items-center gap-1 text-xs text-muted-foreground",
                  children: [
                    _jsx(Globe, { className: "h-3 w-3" }),
                    _jsx("span", {
                      children: stats.last_seen
                        ? `Active ${formatRelativeTime(stats.last_seen)}`
                        : "No recent activity",
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
    ],
  });
}
function StatPill({ icon, value, tooltip }) {
  return _jsxs(Tooltip, {
    children: [
      _jsx(TooltipTrigger, {
        asChild: true,
        children: _jsxs("div", {
          className:
            "flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm",
          children: [icon, _jsx("span", { children: value })],
        }),
      }),
      _jsx(TooltipContent, { children: _jsx("p", { children: tooltip }) }),
    ],
  });
}
function MetricItem({ icon, label, value }) {
  return _jsxs(Tooltip, {
    children: [
      _jsx(TooltipTrigger, {
        asChild: true,
        children: _jsxs("div", {
          className:
            "flex flex-col items-center rounded-md bg-background/50 p-1.5 text-center",
          children: [
            _jsx("div", { className: "mb-0.5", children: icon }),
            _jsx("div", {
              className: "text-xs font-semibold",
              children: value,
            }),
            _jsx("div", {
              className: "text-[10px] text-muted-foreground",
              children: label,
            }),
          ],
        }),
      }),
      _jsx(TooltipContent, {
        children: _jsxs("p", {
          className: "font-medium",
          children: [label, ": ", value],
        }),
      }),
    ],
  });
}
function formatRelativeTime(isoDate) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}
