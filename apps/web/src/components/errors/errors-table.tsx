import { ChevronDownIcon, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { formatDateTime } from '../../lib/spend-log-utils';
import { cn } from '../../lib/utils';
import type { ErrorLog, PaginationMetadata } from '../../types/analytics';
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
import { LogsPaginationControls } from '../logs/logs-pagination-controls';
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

export type ErrorColumnKey =
  | 'time'
  | 'status'
  | 'type'
  | 'model'
  | 'user'
  | 'message'
  | 'requestId';

type ErrorColumn = {
  key: ErrorColumnKey;
  label: string;
  align?: 'right';
  defaultVisible?: boolean;
};

type TableColumn =
  | ErrorColumn
  | {
      key: 'actions';
      label: '';
      align?: 'right';
    };

const ERROR_COLUMNS: ErrorColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'model', label: 'Model' },
  { key: 'user', label: 'User' },
  { key: 'message', label: 'Message' },
  { key: 'requestId', label: 'Request ID', defaultVisible: false },
];

const ACTIONS_COLUMN: TableColumn = {
  key: 'actions',
  label: '',
  align: 'right',
};

export const DEFAULT_VISIBLE_ERROR_COLUMNS: ErrorColumnKey[] =
  ERROR_COLUMNS.filter((column) => column.defaultVisible !== false).map(
    (column) => column.key,
  );

type ErrorsTableProps = {
  errors: ErrorLog[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  visibleColumns: ErrorColumnKey[];
  autoRefetchEnabled: boolean;
  onSelectError: (errorLog: ErrorLog) => void;
  onToggleColumn: (column: ErrorColumnKey) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onRefetch: () => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

function getStatusBadgeClass(statusCode: number): string {
  if (statusCode >= 500) {
    return 'bg-red-500/15 text-red-700 border-red-500/30';
  }

  if (statusCode >= 400) {
    return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
  }

  return 'bg-muted text-muted-foreground';
}

function getErrorTypeBadgeClass(type: string): string {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes('rate')) {
    return 'bg-sky-500/15 text-sky-700 border-sky-500/30';
  }

  if (normalizedType.includes('timeout')) {
    return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
  }

  if (normalizedType.includes('auth') || normalizedType.includes('key')) {
    return 'bg-red-500/15 text-red-700 border-red-500/30';
  }

  return 'bg-muted text-muted-foreground';
}

export function ErrorsTable({
  errors,
  loading,
  refreshing,
  page,
  pageSize,
  pagination,
  visibleColumns,
  autoRefetchEnabled,
  onSelectError,
  onToggleColumn,
  onAutoRefetchChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}: ErrorsTableProps) {
  const isFetching = loading || refreshing;
  const isRefetching = refreshing && !loading;

  const tableColumns: TableColumn[] = [
    ...ERROR_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
    ACTIONS_COLUMN,
  ];

  const hasAnyErrors = pagination.total > 0;

  const renderCell = (errorLog: ErrorLog, columnKey: TableColumn['key']) => {
    const statusCode = errorLog.status_code || 0;
    const errorType = errorLog.error_type || 'Error';
    const message = errorLog.error_message || '-';

    switch (columnKey) {
      case 'time':
        return (
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {errorLog.timestamp ? formatDateTime(errorLog.timestamp) : '-'}
          </span>
        );
      case 'status':
        return (
          <Badge
            variant="secondary"
            className={getStatusBadgeClass(statusCode)}
          >
            {statusCode || 'N/A'}
          </Badge>
        );
      case 'type':
        return (
          <Badge
            variant="secondary"
            className={getErrorTypeBadgeClass(errorType)}
          >
            {errorType}
          </Badge>
        );
      case 'model':
        return (
          <span className="font-mono text-xs font-medium break-all">
            {errorLog.model || '-'}
          </span>
        );
      case 'user':
        return (
          <span className="text-sm text-muted-foreground break-all">
            {errorLog.user || '-'}
          </span>
        );
      case 'message':
        return (
          <span
            className="inline-block max-w-xl text-sm text-muted-foreground"
            title={message}
          >
            {message.length > 96 ? `${message.slice(0, 96)}...` : message}
          </span>
        );
      case 'requestId':
        return (
          <span className="font-mono text-xs text-muted-foreground break-all">
            {errorLog.id}
          </span>
        );
      case 'actions':
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectError(errorLog)}
          >
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
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>
              {loading
                ? 'Loading errors...'
                : hasAnyErrors
                  ? `${pagination.total.toLocaleString('en-US')} matching records`
                  : 'No matching errors for current filters'}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
              <Switch
                id="errors-auto-refetch"
                checked={autoRefetchEnabled}
                onCheckedChange={onAutoRefetchChange}
              />
              <Label
                htmlFor="errors-auto-refetch"
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
                {ERROR_COLUMNS.map((column) => {
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
              {loading && errors.length === 0 ? (
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
              ) : errors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No errors found
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((errorLog) => (
                  <TableRow key={errorLog.id}>
                    {tableColumns.map((column) => (
                      <TableCell
                        key={`${errorLog.id}-${column.key}`}
                        className={column.align === 'right' ? 'text-right' : ''}
                      >
                        {renderCell(errorLog, column.key)}
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
