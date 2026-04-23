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
  safeDivide,
} from '../../pages/dashboard/dashboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Skeleton } from '../skeleton';

type DashboardOverviewCardsProps = {
  loading: boolean;
  rangeLabel: string;
  metrics: DashboardMetrics | null;
  performance: PerformanceMetrics | null;
  tokenDistribution: TokenDistributionItem[];
};

export function DashboardOverviewCards({
  loading,
  rangeLabel,
  metrics,
  performance,
  tokenDistribution,
}: DashboardOverviewCardsProps) {
  const totalRequests = Number(performance?.total_requests ?? 0);
  const totalTokens = Number(metrics?.totalTokens ?? 0);
  const totalSpend = Number(metrics?.totalSpend ?? 0);
  const avgTokensPerRequest = safeDivide(totalTokens, totalRequests);
  const avgCostPerRequest = safeDivide(totalSpend, totalRequests);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-b from-background to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spend ({rangeLabel})
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

        <Card className="bg-gradient-to-b from-background to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tokens ({rangeLabel})
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

        <Card className="bg-gradient-to-b from-background to-violet-500/5">
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

        <Card className="bg-gradient-to-b from-background to-rose-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Errors ({rangeLabel})
            </CardTitle>
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
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests ({rangeLabel})
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

        <Card className="border-border/70">
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

        <Card className="border-border/70">
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

        <Card className="border-border/70">
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
                {formatNumber(avgTokensPerRequest)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-dashed border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Cost / Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(avgCostPerRequest)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tracked Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {formatNumber(tokenDistribution.length)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
