import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { useFilter } from "@/contexts/filter-context";
import { APP_LOCALE } from "@/lib/locale";
import { DashboardEfficiencyCharts } from "../components/dashboard/dashboard-efficiency-charts";
import { DashboardInsights } from "../components/dashboard/dashboard-insights";
import { DashboardOverviewCards } from "../components/dashboard/dashboard-overview-cards";
import { DashboardTopEntities } from "../components/dashboard/dashboard-top-entities";
import { DashboardUsageCharts } from "../components/dashboard/dashboard-usage-charts";
import { PageLayout } from "../components/layout/page-layout/page-layout";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { getDateRangeLabel } from "./dashboard/dashboard-utils";

type ChartTabKey = "usage" | "models" | "efficiency";

export function DashboardPage() {
  const { dateRange, rangeDays } = useFilter();
  const [chartTab, setChartTab] = useState<ChartTabKey>("usage");
  const rangeLabel = getDateRangeLabel(dateRange);

  const {
    metrics,
    spendByUser,
    dailyTrend,
    loading,
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
    });
  }, [lastUpdatedAt]);

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Usage, cost, reliability, and model behavior."
      icon={Activity}
      onReload={() => {
        void refetch();
      }}
      buttons={
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            Auto: 30s
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {lastUpdatedLabel}
          </Badge>
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

export default DashboardPage;
