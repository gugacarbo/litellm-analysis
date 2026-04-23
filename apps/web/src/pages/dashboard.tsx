import { Badge } from '../components/badge';
import { DashboardEfficiencyCharts } from '../components/dashboard/dashboard-efficiency-charts';
import { DashboardOverviewCards } from '../components/dashboard/dashboard-overview-cards';
import { DashboardTopEntities } from '../components/dashboard/dashboard-top-entities';
import { DashboardUsageCharts } from '../components/dashboard/dashboard-usage-charts';
import { Card, CardContent } from '../components/card';
import { useDashboardData } from '../hooks/use-dashboard-data';

export function DashboardPage() {
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
  } = useDashboardData();

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LiteLLM Statistics</h1>
        <Badge variant="outline">Auto-refresh: 30s</Badge>
      </div>

      <DashboardOverviewCards
        loading={loading}
        metrics={metrics}
        performance={performance}
        tokenDistribution={tokenDistribution}
      />

      <DashboardUsageCharts
        loading={loading}
        tokenDistribution={tokenDistribution}
        dailyTrend={dailyTrend}
        modelDistribution={modelDistribution}
        hourlyPatterns={hourlyPatterns}
      />

      <DashboardEfficiencyCharts
        loading={loading}
        costEfficiency={costEfficiency}
        dailyTokenTrend={dailyTokenTrend}
      />

      <DashboardTopEntities
        loading={loading}
        apiKeyStats={apiKeyStats}
        spendByUser={spendByUser}
        tokenDistribution={tokenDistribution}
      />
    </div>
  );
}

export default DashboardPage;
