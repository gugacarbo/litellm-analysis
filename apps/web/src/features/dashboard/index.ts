import { Activity, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";
import { DashboardEfficiencyCharts } from "./components/dashboard-efficiency-charts";
import { DashboardInsights } from "./components/dashboard-insights";
import { DashboardOverviewCards } from "./components/dashboard-overview-cards";
import { DashboardTopEntities } from "./components/dashboard-top-entities";
import { DashboardUsageCharts } from "./components/dashboard-usage-charts";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useFilter } from "@/shared/contexts/filter-context";
import { useDashboardData } from "./hooks/use-dashboard-data";
import { getDateRangeLabel } from "./utils/dashboard-utils";

type ChartTabKey = "usage" | "models" | "efficiency";

export function DashboardPage() {
  const { dateRange: selectedDateRange } = useFilter();
  const rangeLabel = getDateRangeLabel(selectedDateRange);
  const [chartTab, setChartTab] = useState<ChartTabKey>("usage");

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
  } = useDashboardData();

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
