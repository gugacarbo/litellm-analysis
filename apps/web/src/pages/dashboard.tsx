import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { Card, CardContent } from '../components/card';
import { DashboardEfficiencyCharts } from '../components/dashboard/dashboard-efficiency-charts';
import { DashboardInsights } from '../components/dashboard/dashboard-insights';
import { DashboardOverviewCards } from '../components/dashboard/dashboard-overview-cards';
import { DashboardTopEntities } from '../components/dashboard/dashboard-top-entities';
import { DashboardUsageCharts } from '../components/dashboard/dashboard-usage-charts';
import { useDashboardData } from '../hooks/use-dashboard-data';
import type { DashboardDateRangeKey } from './dashboard/dashboard-types';
import {
  DASHBOARD_DATE_RANGES,
  getDateRangeDays,
  getDateRangeLabel,
} from './dashboard/dashboard-utils';

export function DashboardPage() {
  const [selectedDateRange, setSelectedDateRange] =
    useState<DashboardDateRangeKey>('30d');
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
      return '--';
    }
    return lastUpdatedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [lastUpdatedAt]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Usage, cost, reliability, and model behavior for the selected
            period.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {DASHBOARD_DATE_RANGES.map((option) => (
              <Button
                key={option.key}
                variant={
                  option.key === selectedDateRange ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setSelectedDateRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Auto-refresh: 30s</Badge>
            <Badge variant="outline">Last update: {lastUpdatedLabel}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw
                className={`mr-2 h-3.5 w-3.5 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

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
        tokenDistribution={tokenDistribution}
      />

      <DashboardUsageCharts
        loading={loading}
        rangeLabel={rangeLabel}
        tokenDistribution={tokenDistribution}
        dailyTrend={dailyTrend}
        modelDistribution={modelDistribution}
        hourlyPatterns={hourlyPatterns}
      />

      <DashboardEfficiencyCharts
        loading={loading}
        rangeLabel={rangeLabel}
        costEfficiency={costEfficiency}
        dailyTokenTrend={dailyTokenTrend}
      />

      <DashboardInsights loading={loading} insights={insights} />

      <DashboardTopEntities
        loading={loading}
        rangeLabel={rangeLabel}
        apiKeyStats={apiKeyStats}
        spendByUser={spendByUser}
      />
    </div>
  );
}

export default DashboardPage;
