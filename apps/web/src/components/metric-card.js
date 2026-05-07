import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const colorConfig = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    gradientEnd: "to-blue-500/5",
    border: "border-blue-500/20",
    progress: "bg-blue-500",
  },
  green: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    gradientEnd: "to-emerald-500/5",
    border: "border-emerald-500/20",
    progress: "bg-emerald-500",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    gradientEnd: "to-amber-500/5",
    border: "border-amber-500/20",
    progress: "bg-amber-500",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    gradientEnd: "to-red-500/5",
    border: "border-red-500/20",
    progress: "bg-red-500",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    gradientEnd: "to-violet-500/5",
    border: "border-violet-500/20",
    progress: "bg-violet-500",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    gradientEnd: "to-cyan-500/5",
    border: "border-cyan-500/20",
    progress: "bg-cyan-500",
  },
  neutral: {
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-600 dark:text-slate-400",
    gradientEnd: "to-slate-500/5",
    border: "border-slate-500/20",
    progress: "bg-slate-500",
  },
};
export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "gradient",
  colorScheme = "neutral",
  progress,
  loading,
  className,
  valueColor,
  size = "md",
}) {
  const colors = colorConfig[colorScheme];
  const compact = size === "sm";
  if (variant === "gradient") {
    return _jsx("div", {
      className: cn(
        "relative overflow-hidden rounded-xl border bg-linear-to-br",
        compact ? "p-2" : "p-4",
        "from-background",
        colors.gradientEnd,
        colors.border,
        "hover:shadow-sm transition-shadow duration-200",
        className,
      ),
      children: _jsxs("div", {
        className: "relative z-10",
        children: [
          _jsx("div", {
            className: cn(
              "flex items-center justify-between",
              compact ? "mb-1" : "mb-3",
            ),
            children: _jsxs("div", {
              className: "flex items-center gap-2",
              children: [
                Icon &&
                  _jsx("div", {
                    className: cn(
                      "flex items-center justify-center rounded-lg",
                      compact ? "h-7 w-7" : "h-8 w-8",
                      colors.iconBg,
                    ),
                    children: _jsx(Icon, {
                      className: cn(
                        compact ? "h-3.5 w-3.5" : "h-4 w-4",
                        colors.iconColor,
                      ),
                    }),
                  }),
                _jsxs("div", {
                  className: "flex flex-col gap-1",
                  children: [
                    _jsx("span", {
                      className:
                        "text-xs font-medium uppercase tracking-wide text-muted-foreground",
                      children: title,
                    }),
                    description &&
                      compact &&
                      _jsx("span", {
                        className: "text-xs text-muted-foreground",
                        children: description,
                      }),
                  ],
                }),
              ],
            }),
          }),
          loading
            ? _jsx(Skeleton, { className: compact ? "h-7 w-24" : "h-9 w-28" })
            : _jsx("p", {
                className: cn(
                  "mb-1 font-bold tracking-tight",
                  compact ? "text-xl px-4" : "text-2xl",
                  valueColor || "text-foreground",
                ),
                children: value,
              }),
          description &&
            !compact &&
            _jsx("p", {
              className: "text-xs text-muted-foreground",
              children: description,
            }),
          progress &&
            !loading &&
            _jsxs("div", {
              className: compact ? "-mt-1" : "mt-3",
              children: [
                _jsxs("div", {
                  className: "mb-1 flex items-center justify-between",
                  children: [
                    progress.label &&
                      !compact &&
                      _jsx("span", {
                        className: "text-[10px] text-muted-foreground",
                        children: progress.label,
                      }),
                    !compact &&
                      _jsxs("span", {
                        className: "text-[10px] font-medium",
                        children: [
                          ((progress.value / progress.max) * 100).toFixed(1),
                          "%",
                        ],
                      }),
                  ],
                }),
                _jsx("div", {
                  className: cn(
                    "w-full overflow-hidden rounded-full bg-muted",
                    compact ? "h-1" : "h-1.5",
                  ),
                  children: _jsx("div", {
                    className: cn(
                      "h-full rounded-full transition-all duration-500",
                      colors.progress,
                    ),
                    style: {
                      width: `${Math.min(100, Math.max(0, (progress.value / progress.max) * 100))}%`,
                    },
                  }),
                }),
              ],
            }),
        ],
      }),
    });
  }
  if (variant === "simple") {
    return _jsxs(Card, {
      className: className,
      children: [
        _jsx(CardHeader, {
          className: "pb-2",
          children: _jsx(CardTitle, {
            className: "text-sm font-medium",
            children: title,
          }),
        }),
        _jsxs(CardContent, {
          children: [
            loading
              ? _jsx(Skeleton, { className: "h-8 w-24" })
              : _jsx("p", {
                  className: cn("text-2xl font-bold", valueColor),
                  children: value,
                }),
            description &&
              _jsx("p", {
                className: "mt-1 text-xs text-muted-foreground",
                children: description,
              }),
          ],
        }),
      ],
    });
  }
  if (variant === "icon") {
    return _jsxs(Card, {
      className: cn(
        "bg-linear-to-b from-background",
        colors.gradientEnd,
        className,
      ),
      children: [
        _jsx(CardHeader, {
          className: "pb-2",
          children: _jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              Icon &&
                _jsx("div", {
                  className: cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    colors.iconBg,
                  ),
                  children: _jsx(Icon, {
                    className: cn("h-3.5 w-3.5", colors.iconColor),
                  }),
                }),
              _jsx(CardTitle, {
                className: "text-sm font-medium",
                children: title,
              }),
            ],
          }),
        }),
        _jsxs(CardContent, {
          children: [
            loading
              ? _jsx(Skeleton, { className: "h-8 w-24" })
              : _jsx("p", {
                  className: cn("text-2xl font-bold", valueColor),
                  children: value,
                }),
            description &&
              _jsx("p", {
                className: "mt-1 text-xs text-muted-foreground",
                children: description,
              }),
          ],
        }),
      ],
    });
  }
  return null;
}
