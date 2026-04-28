import { cn } from '../../lib/utils';
import {
  formatCurrency,
  formatNumber,
  formatTime,
} from '../../lib/spend-log-utils';
import type { SpendLog } from '../../types/analytics';
import { Badge } from '../badge';
import type { TableColumn } from './logs-table-columns';
import type { GroupSummary } from './logs-table-utils';

export function renderGroupSummaryCell({
  model,
  groupLogs,
  summary,
  column,
}: {
  model: string;
  groupLogs: SpendLog[];
  summary: GroupSummary;
  column: TableColumn;
}) {
  if (column.key === 'actions') {
    return null;
  }

  if (column.key === 'time') {
    return (
      <span className='text-xs whitespace-nowrap text-muted-foreground'>
        {formatTime(groupLogs[0].start_time)} —{' '}
        {formatTime(
          groupLogs[groupLogs.length - 1].start_time,
        )}
      </span>
    );
  }

  if (column.key === 'model') {
    return (
      <div className='flex items-center gap-2'>
        <Badge variant='secondary' className='font-semibold'>
          {model}
        </Badge>
        <span className='text-sm text-muted-foreground'>
          ×{groupLogs.length}
        </span>
      </div>
    );
  }

  if (column.key === 'user') {
    const uniqueUsers = new Set(groupLogs.map((l) => l.user));
    if (uniqueUsers.size > 1) {
      return (
        <span className='text-sm text-muted-foreground'>
          {uniqueUsers.size} users
        </span>
      );
    }
    return (
      <span className='text-sm text-muted-foreground'>
        {groupLogs[0].user || '—'}
      </span>
    );
  }

  if (column.key === 'promptTokens') {
    return (
      <span className='text-right'>
        {formatNumber(summary.totalPromptTokens)}
      </span>
    );
  }

  if (column.key === 'completionTokens') {
    return (
      <span className='text-right'>
        {formatNumber(summary.totalCompletionTokens)}
      </span>
    );
  }

  if (column.key === 'totalTokens') {
    return (
      <span className='text-right font-medium'>
        {formatNumber(summary.totalTokens)}
      </span>
    );
  }

  if (column.key === 'duration') {
    return (
      <span className='text-right'>
        {summary.totalDurationMs.toLocaleString()}
      </span>
    );
  }

  if (column.key === 'timeToFirstToken') {
    return (
      <span
        className={cn(
          'text-right',
          summary.averageTimeToFirstTokenMs === null
            ? 'text-muted-foreground'
            : '',
        )}
      >
        {summary.averageTimeToFirstTokenMs === null
          ? '-'
          : formatNumber(
              Math.round(summary.averageTimeToFirstTokenMs),
            )}
      </span>
    );
  }

  if (column.key === 'tokensPerSecond') {
    return (
      <span
        className={cn(
          'text-right',
          summary.averageTokensPerSecond === null
            ? 'text-muted-foreground'
            : '',
        )}
      >
        {summary.averageTokensPerSecond === null
          ? '-'
          : `${summary.averageTokensPerSecond.toFixed(1)}/s`}
      </span>
    );
  }

  if (column.key === 'spend') {
    return (
      <span className='text-right font-medium'>
        {formatCurrency(summary.totalSpend)}
      </span>
    );
  }

  if (column.key === 'status') {
    return (
      <Badge
        variant={
          summary.groupStatus === 'error'
            ? 'destructive'
            : 'secondary'
        }
        className={
          summary.groupStatus === 'success'
            ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
            : summary.groupStatus === 'partial'
              ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
              : ''
        }
      >
        {summary.groupStatus}
      </Badge>
    );
  }

  return null;
}
