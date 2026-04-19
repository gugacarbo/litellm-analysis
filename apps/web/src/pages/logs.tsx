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

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LogsPage() {
  const { logs, loading } = useDashboardData();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Spend Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: unknown) => {
                  const l = log as {
                    request_id?: string;
                    model?: string;
                    user?: string;
                    total_tokens?: number;
                    spend?: number;
                    start_time?: string;
                    status?: string;
                  };
                  return (
                    <TableRow key={l.request_id}>
                      <TableCell className="text-sm">
                        {formatDateTime(l.start_time || '')}
                      </TableCell>
                      <TableCell>{l.model}</TableCell>
                      <TableCell>{l.user || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(l.total_tokens || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(l.spend || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            l.status === '200' ? 'default' : 'destructive'
                          }
                        >
                          {l.status || 'OK'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
