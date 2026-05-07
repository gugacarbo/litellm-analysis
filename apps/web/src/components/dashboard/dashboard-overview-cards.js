import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../pages/dashboard/dashboard-utils";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
export function DashboardOverviewCards({
  loading,
  rangeLabel,
  metrics,
  performance,
}) {
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
  const skeleton = (className = "h-7 w-20") =>
    _jsx(Skeleton, { className: className });
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
      value: loading ? skeleton() : formatNumber(metrics?.totalTokens ?? 0),
      className: "text-foreground",
    },
    {
      label: "Success Rate",
      value: loading ? skeleton("h-7 w-16") : formatPercent(successRate),
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
  return _jsx(Card, {
    className: "overflow-hidden",
    children: _jsx("div", {
      className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
      children: kpis.map((kpi, index) =>
        _jsxs(
          "div",
          {
            className: "relative flex flex-col gap-1 px-4 py-4",
            children: [
              _jsx("span", {
                className:
                  "text-xs font-medium text-muted-foreground tracking-wide uppercase",
                children: kpi.label,
              }),
              _jsx("span", {
                className: `text-xl font-semibold tabular-nums ${kpi.className}`,
                children: kpi.value,
              }),
              index < kpis.length - 1 &&
                _jsx(Separator, {
                  orientation: "vertical",
                  className:
                    "absolute right-0 top-3 h-[calc(100%-1.5rem)] hidden lg:block",
                }),
            ],
          },
          kpi.label,
        ),
      ),
    }),
  });
}
