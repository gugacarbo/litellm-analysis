import type {
  DashboardMetrics,
  PerformanceMetrics,
} from "../../pages/dashboard/dashboard-types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../pages/dashboard/dashboard-utils";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

type DashboardOverviewCardsProps = {
  loading: boolean;
  rangeLabel: string;
  metrics: DashboardMetrics | null;
  performance: PerformanceMetrics | null;
};

export function DashboardOverviewCards({
  loading,
  rangeLabel,
  metrics,
  performance,
}: DashboardOverviewCardsProps) {
  const successRate = performance?.success_rate ?? 0;
  const successRateColor =
    successRate > 95
      ? "text-emerald-500"
      : successRate > 90
        ? "text-amber-500"
        : "text-red-500";

  const errorCount = metrics?.errorCount ?? 0;
  const errorColor =
    errorCount === 0
      ? "text-emerald-500"
      : errorCount < 10
        ? "text-amber-500"
        : "text-red-500";

  const skeleton = (className = "h-7 w-20") => (
    <Skeleton className={className} />
  );

  const kpis = [
    {
      label: `Total Spend (${rangeLabel})`,
      value: loading
        ? skeleton("h-7 w-24")
        : formatCurrency(metrics?.totalSpend ?? 0),
      className: "text-foreground",
    },
    {
      label: `Total Tokens (${rangeLabel})`,
      value: loading
        ? skeleton()
        : formatNumber(metrics?.totalTokens ?? 0),
      className: "text-foreground",
    },
    {
      label: "Success Rate",
      value: loading
        ? skeleton("h-7 w-16")
        : formatPercent(successRate),
      className: successRateColor,
    },
    {
      label: "Active Models",
      value: loading
        ? skeleton("h-7 w-12")
        : String(metrics?.activeModels ?? 0),
      className: "text-foreground",
    },
    {
      label: "Errors",
      value: loading
        ? skeleton("h-7 w-12")
        : String(errorCount),
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

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="relative flex flex-col gap-1 px-4 py-4"
          >
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              {kpi.label}
            </span>
            <span className={`text-xl font-semibold tabular-nums ${kpi.className}`}>
              {kpi.value}
            </span>
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
  );
}
