import type {
  DashboardMetrics,
  PerformanceMetrics,
  TokenDistributionItem,
} from '../../pages/dashboard/dashboard-types';
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from '../../pages/dashboard/dashboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Skeleton } from '../skeleton';

type DashboardOverviewCardsProps = {
  loading: boolean;
  metrics: DashboardMetrics | null;
  performance: PerformanceMetrics | null;
  tokenDistribution: TokenDistributionItem[];
};

export function DashboardOverviewCards({
  loading,
  metrics,
  performance,
  tokenDistribution,
}: DashboardOverviewCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spend (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(metrics?.totalSpend || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tokens (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(metrics?.totalTokens || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{metrics?.activeModels || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{metrics?.errorCount || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(performance?.total_requests || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatDuration(performance?.avg_duration_ms || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p
                className={`text-2xl font-bold ${
                  (performance?.success_rate || 0) > 95
                    ? 'text-green-600'
                    : (performance?.success_rate || 0) > 90
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {formatPercent(performance?.success_rate || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Tokens/Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(
                  tokenDistribution.reduce(
                    (sum, m) => sum + m.avg_tokens_per_request,
                    0,
                  ) / (tokenDistribution.length || 1),
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
