import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type {
  DashboardInsight,
  DashboardMetrics,
  PerformanceMetrics,
} from "../types/dashboard-types";
import { formatCurrency, formatNumber } from "../utils/dashboard-utils";

function getToneDot(tone: DashboardInsight["tone"]): string {
  if (tone === "positive") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  return "bg-muted-foreground";
}

type KpiItem = {
  label: string;
  value: React.ReactNode;
  className: string;
  icon?: typeof ArrowDownToLine;
};

type DashboardOverviewCardsProps = {
  loading: boolean;
  metrics: DashboardMetrics | null;
  performance: PerformanceMetrics | null;
  insights: DashboardInsight[];
};

export function DashboardOverviewCards({
  loading,
  metrics,
  performance,
  insights,
}: DashboardOverviewCardsProps) {
  const errorCount = metrics?.errorCount ?? 0;
  const errorColor =
    errorCount === 0
      ? "text-emerald-500"
      : errorCount < 10
        ? "text-amber-500"
        : "text-red-500";

  const totalRequests = performance?.total_requests ?? 0;
  const tokensPerRequest =
    totalRequests > 0
      ? Math.round((metrics?.totalTokens ?? 0) / totalRequests)
      : 0;

  const skeleton = (className = "h-7 w-20") => (
    <Skeleton className={className} />
  );

  const kpis: KpiItem[] = [
    {
      label: "Total Spend",
      value: loading
        ? skeleton("h-7 w-24")
        : formatCurrency(metrics?.totalSpend ?? 0),
      className: "text-foreground",
    },
    {
      label: "Input Tokens",
      value: loading
        ? skeleton("h-7 w-20")
        : formatNumber(metrics?.promptTokens ?? 0),
      className: "text-foreground",
      icon: ArrowDownToLine,
    },
    {
      label: "Output Tokens",
      value: loading
        ? skeleton("h-7 w-20")
        : formatNumber(metrics?.completionTokens ?? 0),
      className: "text-foreground",
      icon: ArrowUpFromLine,
    },
    {
      label: "Efficiency",
      value: loading
        ? skeleton("h-7 w-16")
        : `${formatNumber(tokensPerRequest)} tok/req`,
      className: "text-foreground",
    },
    {
      label: "Errors",
      value: loading ? skeleton("h-7 w-12") : String(errorCount),
      className: errorColor,
    },
    {
      label: "Avg Latency",
      value: loading
        ? skeleton("h-7 w-16")
        : `${(performance?.avg_duration_ms ?? 0).toFixed(0)}ms`,
      className: "text-foreground",
    },
  ];

  const hasInsights = insights.length > 0 || loading;

  return (
    <>
      {hasInsights && (
        <div className="flex flex-wrap gap-2">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5"
                >
                  <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            : insights.map((item) => (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <div className="group relative flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm transition-colors hover:bg-muted/60">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          getToneDot(item.tone),
                        )}
                      />
                      <span className="font-medium">{item.value}</span>
                      <span className="text-muted-foreground hidden sm:inline">
                        {item.title}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.detail}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi, index) => (
            <div
              key={kpi.label}
              className="relative flex flex-col gap-1 px-4 py-2"
            >
              <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                {kpi.label}
              </span>
              <span
                className={`text-xl font-semibold tabular-nums ${kpi.className}`}
              >
                {kpi.value}
              </span>
              {kpi.icon && (
                <span className="absolute right-4 top-2 opacity-30">
                  <kpi.icon className="h-5 w-5" />
                </span>
              )}
              {index < kpis.length - 1 && (
                <Separator
                  orientation="vertical"
                  className="absolute right-0 top-3 h-[calc(100%-1.5rem)] hidden lg:block"
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
