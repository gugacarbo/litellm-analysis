import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
} from '../../lib/spend-log-utils';
import type { SpendLog } from '../../types/analytics';
import { Badge } from '../badge';
import { Button } from '../button';
import type { TableColumn } from './logs-table-columns';

type RenderLogCellParams = {
  log: SpendLog;
  columnKey: TableColumn['key'];
  onSelectLog: (log: SpendLog) => void;
};

export function renderLogCell({
  log,
  columnKey,
  onSelectLog,
}: RenderLogCellParams) {
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
        <span className="text-sm text-muted-foreground">{log.user || '-'}</span>
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
}
