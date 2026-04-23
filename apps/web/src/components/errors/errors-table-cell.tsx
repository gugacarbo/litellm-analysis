import { formatDateTime } from '../../lib/spend-log-utils';
import type { ErrorLog } from '../../types/analytics';
import { Badge } from '../badge';
import { Button } from '../button';
import type { TableColumn } from './errors-table-columns';

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

type RenderErrorCellParams = {
  errorLog: ErrorLog;
  columnKey: TableColumn['key'];
  onSelectError: (errorLog: ErrorLog) => void;
};

export function renderErrorCell({
  errorLog,
  columnKey,
  onSelectError,
}: RenderErrorCellParams) {
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
        <Badge variant="secondary" className={getStatusBadgeClass(statusCode)}>
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
}
