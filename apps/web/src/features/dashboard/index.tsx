import { Activity } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { DashboardEfficiencyCharts } from "./components/dashboard-efficiency-charts";
import { DashboardOverviewCards } from "./components/dashboard-overview-cards";
import { DashboardTopEntities } from "./components/dashboard-top-entities";
import { DashboardUsageCharts } from "./components/dashboard-usage-charts";
import { useDashboardData } from "./hooks/use-dashboard-data";

type ChartTabKey = "usage" | "models" | "efficiency";

export function DashboardPage() {
  const [chartTab, setChartTab] = useState<ChartTabKey>("usage");

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
    modelStatistics,
    insights,
  } = useDashboardData();

  return (
    <PageLayout title="Dashboard" icon={Activity}>
      <div className="space-y-4">
        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : null}

        <DashboardOverviewCards
          loading={loading}
          metrics={metrics}
          performance={performance}
          insights={insights}
        />

        <Tabs
          value={chartTab}
          onValueChange={(v) => setChartTab(v as ChartTabKey)}
          className="gap-0"
        >
          <TabsList variant="line">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>
          <TabsContent value="usage">
            <DashboardUsageCharts
              loading={loading}
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
              costEfficiency={costEfficiency}
              dailyTokenTrend={dailyTokenTrend}
              modelStatistics={modelStatistics}
            />
          </TabsContent>
        </Tabs>

        <DashboardTopEntities
          loading={loading}
          apiKeyStats={apiKeyStats}
          spendByUser={spendByUser}
        />
      </div>
    </PageLayout>
  );
}
