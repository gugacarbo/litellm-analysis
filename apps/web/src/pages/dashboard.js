import { Activity, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { DashboardEfficiencyCharts } from "../components/dashboard/dashboard-efficiency-charts";
import { DashboardInsights } from "../components/dashboard/dashboard-insights";
import { DashboardOverviewCards } from "../components/dashboard/dashboard-overview-cards";
import { DashboardTopEntities } from "../components/dashboard/dashboard-top-entities";
import { DashboardUsageCharts } from "../components/dashboard/dashboard-usage-charts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useDashboardData } from "../hooks/use-dashboard-data";
import {
  DASHBOARD_DATE_RANGES,
  getDateRangeDays,
  getDateRangeLabel,
} from "./dashboard/dashboard-utils";
export function DashboardPage() {
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const [chartTab, setChartTab] = useState("usage");
  const rangeDays = getDateRangeDays(selectedDateRange);
  const rangeLabel = getDateRangeLabel(selectedDateRange);
  const {
    metrics,
    spendByUser,
    dailyTrend,
    loading,
    refreshing,
    error,
    tokenDistribution,
    performance,
    hourlyPatterns,
    apiKeyStats,
    costEfficiency,
    modelDistribution,
    dailyTokenTrend,
    lastUpdatedAt,
    insights,
    refetch,
  } = useDashboardData({ days: rangeDays });
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "--";
    }
    return lastUpdatedAt.toLocaleTimeString(APP_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: APP_TIMEZONE,
    });
  }, [lastUpdatedAt]);
  return _jsx(PageLayout, {
    title: "Dashboard",
    subtitle: "Usage, cost, reliability, and model behavior.",
    icon: Activity,
    filters: _jsx("div", {
      className: "flex flex-wrap items-center gap-1.5",
      children: DASHBOARD_DATE_RANGES.map((option) =>
        _jsx(
          Button,
          {
            variant: option.key === selectedDateRange ? "default" : "outline",
            size: "sm",
            className: "h-7 px-2 text-xs",
            onClick: () => setSelectedDateRange(option.key),
            children: option.label,
          },
          option.key,
        ),
      ),
    }),
    buttons: _jsxs("div", {
      className: "flex flex-wrap items-center gap-1.5",
      children: [
        _jsx(Badge, {
          variant: "outline",
          className: "text-xs px-2 py-0.5",
          children: "Auto: 30s",
        }),
        _jsx(Badge, {
          variant: "outline",
          className: "text-xs px-2 py-0.5",
          children: lastUpdatedLabel,
        }),
        _jsxs(Button, {
          variant: "outline",
          size: "sm",
          className: "h-7 px-2 text-xs",
          onClick: () => {
            void refetch();
          },
          children: [
            _jsx(RefreshCw, {
              className: `mr-1.5 h-3 w-3 ${refreshing ? "animate-spin" : ""}`,
            }),
            "Refresh",
          ],
        }),
      ],
    }),
    children: _jsxs("div", {
      className: "space-y-5",
      children: [
        error
          ? _jsx(Card, {
              className: "border-destructive/40 bg-destructive/5",
              children: _jsx(CardContent, {
                className: "p-4",
                children: _jsx("p", {
                  className: "text-sm text-destructive",
                  children: error,
                }),
              }),
            })
          : null,
        _jsx(DashboardOverviewCards, {
          loading: loading,
          rangeLabel: rangeLabel,
          metrics: metrics,
          performance: performance,
        }),
        _jsxs(Tabs, {
          value: chartTab,
          onValueChange: (v) => setChartTab(v),
          children: [
            _jsxs(TabsList, {
              variant: "line",
              children: [
                _jsx(TabsTrigger, { value: "usage", children: "Usage" }),
                _jsx(TabsTrigger, { value: "models", children: "Models" }),
                _jsx(TabsTrigger, {
                  value: "efficiency",
                  children: "Efficiency",
                }),
              ],
            }),
            _jsx(TabsContent, {
              value: "usage",
              children: _jsx(DashboardUsageCharts, {
                loading: loading,
                rangeLabel: rangeLabel,
                variant: "usage",
                tokenDistribution: tokenDistribution,
                dailyTrend: dailyTrend,
                modelDistribution: modelDistribution,
                hourlyPatterns: hourlyPatterns,
              }),
            }),
            _jsx(TabsContent, {
              value: "models",
              children: _jsx(DashboardUsageCharts, {
                loading: loading,
                rangeLabel: rangeLabel,
                variant: "models",
                tokenDistribution: tokenDistribution,
                dailyTrend: dailyTrend,
                modelDistribution: modelDistribution,
                hourlyPatterns: hourlyPatterns,
              }),
            }),
            _jsx(TabsContent, {
              value: "efficiency",
              children: _jsx(DashboardEfficiencyCharts, {
                loading: loading,
                rangeLabel: rangeLabel,
                costEfficiency: costEfficiency,
                dailyTokenTrend: dailyTokenTrend,
              }),
            }),
          ],
        }),
        _jsx(DashboardInsights, { loading: loading, insights: insights }),
        _jsx(DashboardTopEntities, {
          loading: loading,
          rangeLabel: rangeLabel,
          apiKeyStats: apiKeyStats,
          spendByUser: spendByUser,
        }),
      ],
    }),
  });
}
