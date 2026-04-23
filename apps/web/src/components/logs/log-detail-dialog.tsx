import { Clock, DollarSign, Key, User, Zap } from 'lucide-react';
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
  maskApiKey,
} from '../../lib/spend-log-utils';
import type { SpendLog } from '../../types/analytics';
import { Badge } from '../badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../dialog';
import { LogDetailRow } from './log-detail-row';

type LogDetailDialogProps = {
  log: SpendLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogDetailDialog({
  log,
  open,
  onOpenChange,
}: LogDetailDialogProps) {
  if (!log) return null;

  const durationMs =
    new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
  const tokensPerSec = calculateTokensPerSecond(
    log.completion_tokens,
    log.start_time,
    log.end_time,
  );
  const isSuccess = log.status === '200' || log.status === 'success';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {log.model}
            <Badge variant={isSuccess ? 'default' : 'destructive'}>
              {log.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>Request details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 divide-y divide-border">
          <LogDetailRow icon={User} label="User" value={log.user || 'N/A'} />
          <LogDetailRow
            icon={Key}
            label="API Key"
            value={maskApiKey(log.api_key)}
            mono
          />
          <LogDetailRow
            icon={Clock}
            label="Start Time"
            value={formatFullDateTime(log.start_time)}
          />
          <LogDetailRow
            icon={Clock}
            label="End Time"
            value={formatFullDateTime(log.end_time)}
          />
          <LogDetailRow
            icon={Clock}
            label="Duration"
            value={formatDuration(durationMs)}
          />
          <LogDetailRow
            icon={Zap}
            label="Prompt Tokens"
            value={formatNumber(log.prompt_tokens)}
          />
          <LogDetailRow
            icon={Zap}
            label="Completion Tokens"
            value={formatNumber(log.completion_tokens)}
          />
          <LogDetailRow
            icon={Zap}
            label="Total Tokens"
            value={formatNumber(log.total_tokens)}
          />
          <LogDetailRow icon={Zap} label="Tokens/Second" value={tokensPerSec} />
          <LogDetailRow
            icon={DollarSign}
            label="Spend"
            value={formatCurrency(log.spend)}
          />
          <LogDetailRow
            icon={Key}
            label="Request ID"
            value={log.request_id}
            mono
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
