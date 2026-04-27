import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Key,
  Timer,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
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

  const statusConfig = isSuccess
    ? {
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        badge: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      }
    : {
        icon: AlertCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
        badge: "bg-red-500/15 text-red-700 border-red-500/30",
      };

  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${statusConfig.bg}`}
            >
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-mono text-sm sm:text-base break-all pr-4">
                {log.model}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{formatFullDateTime(log.start_time)}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{formatDuration(durationMs)}</span>
              </DialogDescription>
            </div>
            <Badge
              variant={isSuccess ? "secondary" : "destructive"}
              className={statusConfig.badge}
            >
              {log.status}
            </Badge>
            <Badge variant="outline">{log.user || "anonymous"}</Badge>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">
              Request ID
            </span>
            <span className="font-mono text-xs break-all">
              {log.request_id}
            </span>
          </div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={DollarSign}
            label="Total Spend"
            value={formatCurrency(log.spend)}
            accent="text-emerald-500"
          />
          <MetricCard
            icon={Timer}
            label="Duration"
            value={formatDuration(durationMs)}
            accent="text-blue-500"
          />
          <MetricCard
            icon={Zap}
            label="Total Tokens"
            value={formatNumber(log.total_tokens)}
            accent="text-amber-500"
          />
          <MetricCard
            icon={TrendingUp}
            label="Speed"
            value={`${tokensPerSec} tok/s`}
            accent="text-purple-500"
          />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Token Breakdown
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Prompt</span>
                <span className="font-medium">
                  {formatNumber(log.prompt_tokens)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">
                  {formatNumber(log.completion_tokens)}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                <span>Ratio</span>
                <span className="font-medium text-foreground">
                  {log.prompt_tokens > 0
                    ? (log.completion_tokens / log.prompt_tokens).toFixed(2)
                    : "0.00"}
                  :1
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{
                  width: `${
                    log.total_tokens > 0
                      ? (log.prompt_tokens / log.total_tokens) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{
                  width: `${
                    log.total_tokens > 0
                      ? (log.completion_tokens / log.total_tokens) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Request Info
            </div>
            <dl className="divide-y divide-border">
              <DetailRow icon={User} label="User" value={log.user || "N/A"} />
              <DetailRow icon={Key} label="Model" value={log.model} mono />
              <DetailRow
                icon={Key}
                label="API Key"
                value={maskApiKey(log.api_key)}
                mono
              />
              <DetailRow
                icon={isSuccess ? CheckCircle2 : AlertCircle}
                label="Status"
                value={
                  <Badge
                    variant={isSuccess ? "secondary" : "destructive"}
                    className={statusConfig.badge}
                  >
                    {log.status}
                  </Badge>
                }
              />
            </dl>
          </section>

          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Timing Details
            </div>
            <dl className="divide-y divide-border">
              <DetailRow
                icon={Clock}
                label="Start Time"
                value={formatFullDateTime(log.start_time)}
              />
              <DetailRow
                icon={Clock}
                label="End Time"
                value={formatFullDateTime(log.end_time)}
              />
              <DetailRow
                icon={Timer}
                label="Duration"
                value={formatDuration(durationMs)}
              />
              <DetailRow
                icon={TrendingUp}
                label="Tokens/Second"
                value={tokensPerSec}
              />
            </dl>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 px-3 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </dt>
      <dd
        className={`text-sm font-medium break-words ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
