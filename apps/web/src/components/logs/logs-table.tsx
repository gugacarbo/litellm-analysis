import {
  ChevronDownIcon,
  ChevronRightIcon,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import {
  formatCurrency,
  formatNumber,
  formatTime,
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
import { renderLogCell } from './logs-table-cell';
import {
  LOG_COLUMNS,
  type LogColumnKey,
  type TableColumn,
} from './logs-table-columns';

export { DEFAULT_VISIBLE_LOG_COLUMNS } from './logs-table-columns';

type LogsTableProps = {
  logs: SpendLog[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  visibleColumns: LogColumnKey[];
  autoRefetchEnabled: boolean;
  groupByModel: boolean;
  onSelectLog: (log: SpendLog) => void;
  onToggleColumn: (column: LogColumnKey) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onGroupByModelChange: (enabled: boolean) => void;
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
  groupByModel,
  onSelectLog,
  onToggleColumn,
  onAutoRefetchChange,
  onGroupByModelChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}: LogsTableProps) {
  const isFetching = loading || refreshing;

  const tableColumns: TableColumn[] = [
    ...LOG_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
  ];
  const showGroupExpanderColumn = groupByModel;

  const hasAnyLogs = pagination.total > 0;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const groupedLogs = useMemo(() => {
    if (!groupByModel || logs.length === 0) return null;

    // Group consecutive logs with the same model (run-length encoding style)
    const groups: Array<{ model: string; logs: SpendLog[] }> = [];
    let currentGroup: { model: string; logs: SpendLog[] } | null = null;

    for (const log of logs) {
      if (currentGroup && currentGroup.model === log.model) {
        currentGroup.logs.push(log);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { model: log.model, logs: [log] };
      }
    }
    if (currentGroup) {
      groups.push(currentGroup);
    }

    // Set initial expanded state
    const initialExpanded: Record<string, boolean> = {};
    for (const group of groups) {
      const key = `${group.model}-${group.logs[0].request_id}`;
      if (expandedGroups[key] === undefined) {
        initialExpanded[key] = false;
      }
    }
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedGroups((prev) => ({ ...prev, ...initialExpanded }));
    }

    return groups;
  }, [groupByModel, logs, expandedGroups]);

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
            <Button
              variant={groupByModel ? 'default' : 'outline'}
              size="sm"
              onClick={() => onGroupByModelChange(!groupByModel)}
            >
              <ChevronDownIcon
                className={cn(
                  'mr-1 h-3.5 w-3.5 transition-transform',
                  !groupByModel && '-rotate-90',
                )}
              />
              Group by Model
            </Button>
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
                Auto refetch 15s
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
              Refresh
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
                {showGroupExpanderColumn ? (
                  <TableHead className="w-10" aria-label="Expand group" />
                ) : null}
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
                    {showGroupExpanderColumn ? (
                      <TableCell className="w-10">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    ) : null}
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
                    colSpan={
                      tableColumns.length + (showGroupExpanderColumn ? 1 : 0)
                    }
                    className="py-8 text-center text-muted-foreground"
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : groupedLogs ? (
                groupedLogs.map((group) => {
                  const { model, logs: groupLogs } = group;
                  const groupKey = `${model}-${groupLogs[0].request_id}`;
                  const isExpanded = expandedGroups[groupKey] ?? false;

                  // Calculate sums for the group
                  const totalSpend = groupLogs.reduce(
                    (sum, log) => sum + log.spend,
                    0,
                  );
                  const totalPromptTokens = groupLogs.reduce(
                    (sum, log) => sum + log.prompt_tokens,
                    0,
                  );
                  const totalCompletionTokens = groupLogs.reduce(
                    (sum, log) => sum + log.completion_tokens,
                    0,
                  );
                  const totalTokens = groupLogs.reduce(
                    (sum, log) => sum + log.total_tokens,
                    0,
                  );
                  const totalDurationMs = groupLogs.reduce((sum, log) => {
                    const start = new Date(log.start_time).getTime();
                    const end = new Date(log.end_time).getTime();
                    return sum + (end - start);
                  }, 0);
                  const tokensPerSecondValues = groupLogs
                    .map((log) => {
                      const start = new Date(log.start_time).getTime();
                      const end = new Date(log.end_time).getTime();
                      const durationMs = end - start;
                      if (durationMs <= 0 || !log.completion_tokens) {
                        return null;
                      }
                      return log.completion_tokens / (durationMs / 1000);
                    })
                    .filter((value): value is number => value !== null);
                  const averageTokensPerSecond =
                    tokensPerSecondValues.length > 0
                      ? tokensPerSecondValues.reduce(
                          (sum, value) => sum + value,
                          0,
                        ) / tokensPerSecondValues.length
                      : null;
                  const timeToFirstTokenValues = groupLogs
                    .map((log) => log.time_to_first_token_ms)
                    .filter(
                      (value): value is number =>
                        value !== null && !Number.isNaN(value),
                    );
                  const averageTimeToFirstTokenMs =
                    timeToFirstTokenValues.length > 0
                      ? timeToFirstTokenValues.reduce(
                          (sum, value) => sum + value,
                          0,
                        ) / timeToFirstTokenValues.length
                      : null;
                  const successCount = groupLogs.filter(
                    (log) => log.status === '200' || log.status === 'success',
                  ).length;
                  const groupStatus =
                    successCount === groupLogs.length
                      ? 'success'
                      : successCount === 0
                        ? 'error'
                        : 'partial';

                  // Helper to render a summary cell for group rows
                  const renderGroupSummaryCell = (column: TableColumn) => {
                    // Actions column - not shown in summary
                    if (column.key === 'actions') {
                      return null;
                    }

                    // Time column - show time range for the group
                    if (column.key === 'time') {
                      return (
                        <span className="text-xs whitespace-nowrap text-muted-foreground">
                          {formatTime(groupLogs[0].start_time)} —{' '}
                          {formatTime(
                            groupLogs[groupLogs.length - 1].start_time,
                          )}
                        </span>
                      );
                    }

                    // Model column - show model with count
                    if (column.key === 'model') {
                      return (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold">
                            {model}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ×{groupLogs.length}
                          </span>
                        </div>
                      );
                    }

                    // User column - show "multiple" if mixed
                    if (column.key === 'user') {
                      const uniqueUsers = new Set(groupLogs.map((l) => l.user));
                      if (uniqueUsers.size > 1) {
                        return (
                          <span className="text-sm text-muted-foreground">
                            {uniqueUsers.size} users
                          </span>
                        );
                      }
                      return (
                        <span className="text-sm text-muted-foreground">
                          {groupLogs[0].user || '—'}
                        </span>
                      );
                    }

                    // Token columns - show summed values
                    if (column.key === 'promptTokens') {
                      return (
                        <span className="text-right">
                          {formatNumber(totalPromptTokens)}
                        </span>
                      );
                    }
                    if (column.key === 'completionTokens') {
                      return (
                        <span className="text-right">
                          {formatNumber(totalCompletionTokens)}
                        </span>
                      );
                    }
                    if (column.key === 'totalTokens') {
                      return (
                        <span className="text-right font-medium">
                          {formatNumber(totalTokens)}
                        </span>
                      );
                    }

                    // Duration - show total duration for the group
                    if (column.key === 'duration') {
                      return (
                        <span className="text-right">
                          {totalDurationMs.toLocaleString()}
                        </span>
                      );
                    }

                    if (column.key === 'timeToFirstToken') {
                      return (
                        <span
                          className={cn(
                            'text-right',
                            averageTimeToFirstTokenMs === null
                              ? 'text-muted-foreground'
                              : '',
                          )}
                        >
                          {averageTimeToFirstTokenMs === null
                            ? '-'
                            : formatNumber(
                                Math.round(averageTimeToFirstTokenMs),
                              )}
                        </span>
                      );
                    }

                    // Tokens/s - show average across valid group entries
                    if (column.key === 'tokensPerSecond') {
                      return (
                        <span
                          className={cn(
                            'text-right',
                            averageTokensPerSecond === null
                              ? 'text-muted-foreground'
                              : '',
                          )}
                        >
                          {averageTokensPerSecond === null
                            ? '-'
                            : `${averageTokensPerSecond.toFixed(1)}/s`}
                        </span>
                      );
                    }

                    // Spend - show total spend
                    if (column.key === 'spend') {
                      return (
                        <span className="text-right font-medium">
                          {formatCurrency(totalSpend)}
                        </span>
                      );
                    }

                    // Status - show "—" for aggregated row
                    if (column.key === 'status') {
                      return (
                        <Badge
                          variant={
                            groupStatus === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            groupStatus === 'success'
                              ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                              : groupStatus === 'partial'
                                ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                : ''
                          }
                        >
                          {groupStatus}
                        </Badge>
                      );
                    }

                    return null;
                  };

                  return (
                    <Fragment key={groupKey}>
                      <TableRow
                        className="cursor-pointer bg-muted/50 hover:bg-muted"
                        onClick={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [groupKey]: !prev[groupKey],
                          }))
                        }
                      >
                        {/* Expand icon */}
                        <TableCell className="w-10">
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        {tableColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={
                              column.align === 'right' ? 'text-right' : ''
                            }
                          >
                            {renderGroupSummaryCell(column)}
                          </TableCell>
                        ))}
                      </TableRow>
                      {isExpanded &&
                        groupLogs.map((log) => (
                          <TableRow
                            key={log.request_id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onSelectLog(log)}
                          >
                            {showGroupExpanderColumn ? (
                              <TableCell className="w-10" />
                            ) : null}
                            {tableColumns.map((column) => (
                              <TableCell
                                key={`${log.request_id}-${column.key}`}
                                className={
                                  column.align === 'right' ? 'text-right' : ''
                                }
                              >
                                {renderLogCell({
                                  log,
                                  columnKey: column.key,
                                })}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                    </Fragment>
                  );
                })
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.request_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectLog(log)}
                  >
                    {tableColumns.map((column) => (
                      <TableCell
                        key={`${log.request_id}-${column.key}`}
                        className={column.align === 'right' ? 'text-right' : ''}
                      >
                        {renderLogCell({
                          log,
                          columnKey: column.key,
                        })}
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
