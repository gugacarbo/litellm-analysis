import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
} from '../../lib/spend-log-utils';
import type { PaginationMetadata, SpendLog } from '../../types/analytics';
import { Badge } from '../badge';
import { Button } from '../button';
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
import { LogsPaginationControls } from './logs-pagination-controls';

type LogsTableProps = {
  logs: SpendLog[];
  loading: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  onSelectLog: (log: SpendLog) => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

export function LogsTable({
  logs,
  loading,
  page,
  pageSize,
  pagination,
  onSelectLog,
  onPageChange,
  onPageSizeChange,
}: LogsTableProps) {
  return (
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
              <TableHead className="text-right">Prompt Tokens</TableHead>
              <TableHead className="text-right">Completion Tokens</TableHead>
              <TableHead className="text-right">Total Tokens</TableHead>
              <TableHead className="text-right">Duration (ms)</TableHead>
              <TableHead className="text-right">Tokens/s</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
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
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
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
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-muted-foreground"
                >
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const durationMs =
                  new Date(log.end_time).getTime() -
                  new Date(log.start_time).getTime();

                return (
                  <TableRow key={log.request_id}>
                    <TableCell className="text-sm">
                      {formatDateTime(log.start_time)}
                    </TableCell>
                    <TableCell>{log.model}</TableCell>
                    <TableCell>{log.user || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(log.prompt_tokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(log.completion_tokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(log.total_tokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(durationMs)}
                    </TableCell>
                    <TableCell className="text-right">
                      {calculateTokensPerSecond(
                        log.completion_tokens,
                        log.start_time,
                        log.end_time,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(log.spend)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === '200' || log.status === 'success'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectLog(log)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <LogsPaginationControls
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
}
