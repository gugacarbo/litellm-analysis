import type {
  ApiKeyStatItem,
  SpendByUserItem,
  TokenDistributionItem,
} from '../../pages/dashboard/dashboard-types';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../../pages/dashboard/dashboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Skeleton } from '../skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

type DashboardTopEntitiesProps = {
  loading: boolean;
  apiKeyStats: ApiKeyStatItem[];
  spendByUser: SpendByUserItem[];
  tokenDistribution: TokenDistributionItem[];
};

export function DashboardTopEntities({
  loading,
  apiKeyStats,
  spendByUser,
  tokenDistribution,
}: DashboardTopEntitiesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top API Keys (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Key</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Success</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : apiKeyStats.slice(0, 10).map((k, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {k.key.slice(0, 12)}...
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(k.request_count)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(k.total_spend)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(k.total_tokens)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          k.success_rate > 95
                            ? 'text-green-600'
                            : k.success_rate > 90
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {formatPercent(k.success_rate)}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Users (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : spendByUser.slice(0, 10).map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {u.user || 'Anonymous'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(u.total_spend)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(u.total_tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(
                          tokenDistribution.reduce(
                            (sum, m) => sum + (m.avg_tokens_per_request || 0),
                            0,
                          ),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
