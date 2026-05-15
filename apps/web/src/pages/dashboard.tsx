import { Activity, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
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
import type { DashboardDateRangeKey } from "./dashboard/dashboard-types";
import {
  DASHBOARD_DATE_RANGES,
  getDateRangeDays,
  getDateRangeLabel,
} from "./dashboard/dashboard-utils";

type ChartTabKey = "usage" | "models" | "efficiency";

export function DashboardPage() {
  const [selectedDateRange, setSelectedDateRange] =
    useState<DashboardDateRangeKey>("30d");
  const [chartTab, setChartTab] = useState<ChartTabKey>("usage");
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
    modelStatistics,
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

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Usage, cost, reliability, and model behavior."
      icon={Activity}
      filters={
        <div className="flex flex-wrap items-center gap-1.5">
          {DASHBOARD_DATE_RANGES.map((option) => (
            <Button
              key={option.key}
              variant={option.key === selectedDateRange ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedDateRange(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      }
      buttons={
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            Auto: 30s
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {lastUpdatedLabel}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw
              className={`mr-1.5 h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : null}

        <DashboardOverviewCards
          loading={loading}
          rangeLabel={rangeLabel}
          metrics={metrics}
          performance={performance}
        />

        <Tabs
          value={chartTab}
          onValueChange={(v) => setChartTab(v as ChartTabKey)}
        >
          <TabsList variant="line">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>
          <TabsContent value="usage">
            <DashboardUsageCharts
              loading={loading}
              rangeLabel={rangeLabel}
              variant="usage"
              tokenDistribution={tokenDistribution}
              dailyTrend={dailyTrend}
              modelDistribution={modelDistribution}
              hourlyPatterns={hourlyPatterns}
            />
          </TabsContent>
          <TabsContent value="models">
            <DashboardUsageCharts
              loading={loading}
              rangeLabel={rangeLabel}
              variant="models"
              tokenDistribution={tokenDistribution}
              dailyTrend={dailyTrend}
              modelDistribution={modelDistribution}
              hourlyPatterns={hourlyPatterns}
            />
          </TabsContent>
          <TabsContent value="efficiency">
            <DashboardEfficiencyCharts
              loading={loading}
              rangeLabel={rangeLabel}
              costEfficiency={costEfficiency}
              dailyTokenTrend={dailyTokenTrend}
              modelStatistics={modelStatistics}
            />
          </TabsContent>
        </Tabs>

        <DashboardInsights loading={loading} insights={insights} />

        <DashboardTopEntities
          loading={loading}
          rangeLabel={rangeLabel}
          apiKeyStats={apiKeyStats}
          spendByUser={spendByUser}
        />
      </div>
    </PageLayout>
  );
}
