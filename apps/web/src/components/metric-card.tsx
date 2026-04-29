import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

type ColorScheme =
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "cyan"
  | "neutral";

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: React.ReactNode;
  icon?: LucideIcon;
  variant?: "gradient" | "simple" | "icon";
  colorScheme?: ColorScheme;
  progress?: { value: number; max: number; label?: string };
  loading?: boolean;
  className?: string;
  valueColor?: string;
  size?: "sm" | "md";
};

const colorConfig: Record<
  ColorScheme,
  {
    iconBg: string;
    iconColor: string;
    gradientEnd: string;
    border: string;
    progress: string;
  }
> = {
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

export type { ColorScheme, MetricCardProps };

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
}: MetricCardProps) {
  const colors = colorConfig[colorScheme];
  const compact = size === "sm";

  if (variant === "gradient") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-linear-to-br",
          compact ? "p-2" : "p-4",
          "from-background",
          colors.gradientEnd,
          colors.border,
          "hover:shadow-sm transition-shadow duration-200",
          className,
        )}
      >
        <div className="relative z-10">
          <div
            className={cn(
              "flex items-center justify-between",
              compact ? "mb-1" : "mb-3",
            )}
          >
            <div className="flex items-center gap-2">
              {Icon && (
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg",
                    compact ? "h-7 w-7" : "h-8 w-8",
                    colors.iconBg,
                  )}
                >
                  <Icon
                    className={cn(
                      compact ? "h-3.5 w-3.5" : "h-4 w-4",
                      colors.iconColor,
                    )}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {title}
                </span>
                {description && compact && (
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <Skeleton className={compact ? "h-7 w-24" : "h-9 w-28"} />
          ) : (
            <p
              className={cn(
                "mb-1 font-bold tracking-tight",
                compact ? "text-xl px-4" : "text-2xl",
                valueColor || "text-foreground",
              )}
            >
              {value}
            </p>
          )}

          {description && !compact && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {progress && !loading && (
            <div className={compact ? "-mt-1" : "mt-3"}>
              <div className="mb-1 flex items-center justify-between">
                {progress.label && !compact && (
                  <span className="text-[10px] text-muted-foreground">
                    {progress.label}
                  </span>
                )}
                {!compact && (
                  <span className="text-[10px] font-medium">
                    {((progress.value / progress.max) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "w-full overflow-hidden rounded-full bg-muted",
                  compact ? "h-1" : "h-1.5",
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    colors.progress,
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, (progress.value / progress.max) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "icon") {
    return (
      <Card
        className={cn(
          "bg-linear-to-b from-background",
          colors.gradientEnd,
          className,
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  colors.iconBg,
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", colors.iconColor)} />
              </div>
            )}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
