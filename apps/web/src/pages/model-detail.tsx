import { Badge } from '../components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/card';
import { Skeleton } from '../components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { useParams } from 'react-router-dom';
import { useDashboardData } from '../hooks/use-dashboard-data';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function ModelDetailPage() {
  const { modelName } = useParams<{ modelName: string }>();
  const { spendByModel, spendByUser, loading } = useDashboardData();

  const model = spendByModel.find((m) => m.model === modelName);
  const modelUsers = spendByUser.slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-lg px-4 py-1">
          {modelName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(model?.total_spend || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">% of Total</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {model?.total_spend
                  ? (
                      (model.total_spend /
                        spendByModel.reduce((s, m) => s + m.total_spend, 0)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">
                #{spendByModel.findIndex((m) => m.model === modelName) + 1}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
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
                    </TableRow>
                  ))
                : modelUsers.map((u, i) => (
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
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
