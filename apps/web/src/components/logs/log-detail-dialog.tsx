import { Clock, DollarSign, Key, User, Zap } from "lucide-react";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
  maskApiKey,
} from "../../lib/spend-log-utils";
import type { SpendLog } from "../../types/analytics";
import { Badge } from "../badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { LogDetailRow } from "./log-detail-row";

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
  const isSuccess = log.status === "200" || log.status === "success";
  const statusBadgeClass = isSuccess
    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="font-mono text-sm sm:text-base break-all">
              {log.model}
            </DialogTitle>
            <Badge
              variant={isSuccess ? "secondary" : "destructive"}
              className={statusBadgeClass}
            >
              {log.status}
            </Badge>
            <Badge variant="outline">{log.user || "anonymous"}</Badge>
          </div>
          <DialogDescription>
            Request started at {formatFullDateTime(log.start_time)}
          </DialogDescription>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Request ID
            </div>
            <div className="font-mono text-xs break-all">{log.request_id}</div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: DollarSign,
              label: "Spend",
              value: formatCurrency(log.spend),
            },
            {
              icon: Clock,
              label: "Duration",
              value: formatDuration(durationMs),
            },
            {
              icon: Zap,
              label: "Total Tokens",
              value: formatNumber(log.total_tokens),
            },
            {
              icon: Zap,
              label: "Tokens / Second",
              value: tokensPerSec,
            },
          ].map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="rounded-lg border bg-muted/20 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {metric.label}
                </div>
                <div className="mt-1 text-sm font-semibold">{metric.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Request Context
            </div>
            <div className="divide-y divide-border">
              <LogDetailRow
                icon={User}
                label="User"
                value={log.user || "N/A"}
              />
              <LogDetailRow icon={Key} label="Model" value={log.model} />
              <LogDetailRow
                icon={Key}
                label="API Key"
                value={maskApiKey(log.api_key)}
                mono
              />
              <LogDetailRow
                icon={Key}
                label="Status"
                value={
                  <Badge
                    variant={isSuccess ? "secondary" : "destructive"}
                    className={statusBadgeClass}
                  >
                    {log.status}
                  </Badge>
                }
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Timing & Tokens
            </div>
            <div className="divide-y divide-border">
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
              <LogDetailRow
                icon={Zap}
                label="Tokens/Second"
                value={tokensPerSec}
              />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
