import { ChevronDownIcon, RefreshCw, SlidersHorizontal } from 'lucide-react';
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
} from '../../lib/spend-log-utils';
import { cn } from '../../lib/utils';
import type { PaginationMetadata, SpendLog } from '../../types/analytics';
import { Badge } from '../badge';
import { Button } from '../button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Label } from '../label';
import { Skeleton } from '../skeleton';
import { Switch } from '../switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';
import { LogsPaginationControls } from './logs-pagination-controls';

export type LogColumnKey =
  | 'time'
  | 'model'
  | 'user'
  | 'promptTokens'
  | 'completionTokens'
  | 'totalTokens'
  | 'duration'
  | 'tokensPerSecond'
  | 'spend'
  | 'status'
  | 'requestId';

type LogColumn = {
  key: LogColumnKey;
  label: string;
  align?: 'right';
  defaultVisible?: boolean;
};

type TableColumn = LogColumn | { key: 'actions'; label: ''; align?: 'right' };

const LOG_COLUMNS: LogColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'model', label: 'Model' },
  { key: 'user', label: 'User' },
  {
    key: 'promptTokens',
    label: 'Prompt Tokens',
    align: 'right',
  },
  {
    key: 'completionTokens',
    label: 'Completion Tokens',
    align: 'right',
  },
  { key: 'totalTokens', label: 'Total Tokens', align: 'right' },
  { key: 'duration', label: 'Duration (ms)', align: 'right' },
  { key: 'tokensPerSecond', label: 'Tokens/s', align: 'right' },
  { key: 'spend', label: 'Spend', align: 'right' },
  { key: 'status', label: 'Status' },
  {
    key: 'requestId',
    label: 'Request ID',
    defaultVisible: false,
  },
];

const ACTIONS_COLUMN: TableColumn = {
  key: 'actions',
  label: '',
  align: 'right',
};

export const DEFAULT_VISIBLE_LOG_COLUMNS: LogColumnKey[] = LOG_COLUMNS.filter(
  (column) => column.defaultVisible !== false,
).map((column) => column.key);

type LogsTableProps = {
  logs: SpendLog[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  visibleColumns: LogColumnKey[];
  autoRefetchEnabled: boolean;
  onSelectLog: (log: SpendLog) => void;
  onToggleColumn: (column: LogColumnKey) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onRefetch: () => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

export function LogsTable({
  logs,
  loading,
  refreshing,
  page,
  pageSize,
  pagination,
  visibleColumns,
  autoRefetchEnabled,
  onSelectLog,
  onToggleColumn,
  onAutoRefetchChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}: LogsTableProps) {
  const isFetching = loading || refreshing;
  const isRefetching = refreshing && !loading;

  const tableColumns: TableColumn[] = [
    ...LOG_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
    ACTIONS_COLUMN,
  ];

  const hasAnyLogs = pagination.total > 0;

  const renderCell = (log: SpendLog, columnKey: TableColumn['key']) => {
    const durationMs =
      new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
    const isSuccess = log.status === '200' || log.status === 'success';

    switch (columnKey) {
      case 'time':
        return (
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {formatDateTime(log.start_time)}
          </span>
        );
      case 'model':
        return (
          <span className="font-mono text-xs font-medium break-all">
            {log.model}
          </span>
        );
      case 'user':
        return (
          <span className="text-sm text-muted-foreground">
            {log.user || '-'}
          </span>
        );
      case 'promptTokens':
        return formatNumber(log.prompt_tokens);
      case 'completionTokens':
        return formatNumber(log.completion_tokens);
      case 'totalTokens':
        return (
          <span className="font-medium">{formatNumber(log.total_tokens)}</span>
        );
      case 'duration':
        return formatDuration(durationMs);
      case 'tokensPerSecond':
        return calculateTokensPerSecond(
          log.completion_tokens,
          log.start_time,
          log.end_time,
        );
      case 'spend':
        return <span className="font-medium">{formatCurrency(log.spend)}</span>;
      case 'status':
        return (
          <Badge
            variant={isSuccess ? 'secondary' : 'destructive'}
            className={
              isSuccess
                ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                : ''
            }
          >
            {log.status}
          </Badge>
        );
      case 'requestId':
        return (
          <span className="font-mono text-xs text-muted-foreground break-all">
            {log.request_id}
          </span>
        );
      case 'actions':
        return (
          <Button variant="ghost" size="sm" onClick={() => onSelectLog(log)}>
            Open
          </Button>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>
              {loading
                ? 'Loading logs...'
                : hasAnyLogs
                  ? `${pagination.total.toLocaleString('en-US')} matching records`
                  : 'No matching logs for current filters'}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
              <Switch
                id="logs-auto-refetch"
                checked={autoRefetchEnabled}
                onCheckedChange={onAutoRefetchChange}
              />
              <Label
                htmlFor="logs-auto-refetch"
                className="text-xs text-muted-foreground"
              >
                Auto refetch 5s
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn(
                  'mr-1 h-3.5 w-3.5',
                  isFetching ? 'animate-spin' : '',
                )}
              />
              {isRefetching ? 'Refetching...' : 'Refresh'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                  Columns
                  <ChevronDownIcon className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LOG_COLUMNS.map((column) => {
                  const checked = visibleColumns.includes(column.key);

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={checked}
                      disabled={checked && visibleColumns.length === 1}
                      onCheckedChange={() => onToggleColumn(column.key)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.align === 'right' ? 'text-right' : ''}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                Array.from({ length: 10 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {tableColumns.map((column) => (
                      <TableCell
                        key={`${rowIndex}-${column.key}`}
                        className={column.align === 'right' ? 'text-right' : ''}
                      >
                        <Skeleton
                          className={
                            column.align === 'right'
                              ? 'h-4 w-14 ml-auto'
                              : 'h-4 w-24'
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.request_id}>
                    {tableColumns.map((column) => (
                      <TableCell
                        key={`${log.request_id}-${column.key}`}
                        className={column.align === 'right' ? 'text-right' : ''}
                      >
                        {renderCell(log, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
