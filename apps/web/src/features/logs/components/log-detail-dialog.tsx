import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  MessageCircle,
  MessageSquare,
  type Sparkles,
  Timer,
  TrendingUp,
  Webhook,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ReadonlyInteractionThread } from "@/shared/components/automatic-interactions";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CollapsibleSection } from "@/shared/components/ui/collapsible-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { JsonViewer } from "@/shared/components/ui/json-viewer";
import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import {
  extractSpendLogMessages,
  normalizeSpendLogThread,
  resolveSpendLogRawPayload,
} from "@/shared/lib/automatic-interactions";
import {
  calculateProxyLogTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
  getProxyLogDurationMs,
  getProxyLogInputTokens,
  getProxyLogOutputTokens,
  getProxyLogTotalCost,
  isProxyLogSuccess,
} from "@/shared/lib/spend-log-utils";
import { ContextBadge } from "./log-detail-context-badge";
import { LogDetailInfoSections } from "./log-detail-info-section";
import { MiniMetricCard } from "./log-detail-metric-card";
import { LogEstimatedBadges } from "./log-estimated-badges";

type LogDetailDialogProps = {
  log: ProxyRequestLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogDetailDialog({
  log,
  open,
  onOpenChange,
}: LogDetailDialogProps) {
  const [copied, setCopied] = useState(false);
  const messageThread = useMemo(
    () => (log ? normalizeSpendLogThread(log) : null),
    [log],
  );
  const resolveRawPayload = useMemo(
    () =>
      log ? (ref: string) => resolveSpendLogRawPayload(log, ref) : undefined,
    [log],
  );
  const chatMessageCount = log ? extractSpendLogMessages(log).length : 0;

  if (!log) return null;

  const durationMs = getProxyLogDurationMs(log);
  const tokensPerSec = calculateProxyLogTokensPerSecond(log);
  const inputTokens = getProxyLogInputTokens(log);
  const outputTokens = getProxyLogOutputTokens(log);
  const totalTokens = log.total_tokens ?? inputTokens + outputTokens;
  const isSuccess = isProxyLogSuccess(log.status);

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

  const handleCopyRequestId = async () => {
    await navigator.clipboard.writeText(log.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contextBadges: {
    label: string;
    icon: typeof Sparkles;
    variant: "success" | "info" | "warning" | "purple" | "cyan" | "default";
  }[] = [];

  if (log.cached_tokens != null && log.cached_tokens > 0) {
    contextBadges.push({
      label: `Cache ${formatNumber(log.cached_tokens)} tokens`,
      icon: Zap,
      variant: "success",
    });
  }

  if (log.messages.length > 0) {
    contextBadges.push({
      label: "Chat",
      icon: MessageSquare,
      variant: "purple",
    });
  }

  if (log.response_body) {
    contextBadges.push({
      label: "Streaming",
      icon: Webhook,
      variant: "cyan",
    });
  }

  const hasContextBadges = contextBadges.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
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
              <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <span>{formatFullDateTime(log.started_at)}</span>
                <span className="text-muted-foreground/50">&bull;</span>
                <span>{formatDuration(durationMs)}</span>
                {log.upstream_model ? (
                  <>
                    <span className="text-muted-foreground/50">&bull;</span>
                    <span className="font-mono text-xs">
                      {log.upstream_model}
                    </span>
                  </>
                ) : null}
              </DialogDescription>
            </div>
            <Badge
              variant={isSuccess ? "secondary" : "destructive"}
              className={statusConfig.badge}
            >
              {log.status}
            </Badge>
            <LogEstimatedBadges
              usageEstimated={log.usage_estimated}
              costEstimated={log.cost_estimated}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">
              Request ID
            </span>
            <span className="font-mono text-xs break-all flex-1">{log.id}</span>
            <button
              type="button"
              onClick={handleCopyRequestId}
              className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
              title="Copy request ID"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/logs/${log.id}/chat`}>
                <MessageCircle className="h-4 w-4" />
                Chat Simulation
              </Link>
            </Button>
          </div>
        </DialogHeader>

        {hasContextBadges ? (
          <div className="flex flex-wrap gap-2">
            {contextBadges.map((badge) => (
              <ContextBadge
                key={badge.label}
                label={badge.label}
                icon={badge.icon}
                variant={badge.variant}
              />
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MiniMetricCard
            icon={DollarSign}
            label="Total Cost"
            value={formatCurrency(getProxyLogTotalCost(log))}
            accent="text-emerald-500"
          />
          <MiniMetricCard
            icon={Timer}
            label="Duration"
            value={formatDuration(durationMs)}
            accent="text-blue-500"
          />
          <MiniMetricCard
            icon={Zap}
            label="Total Tokens"
            value={formatNumber(totalTokens)}
            accent="text-amber-500"
          />
          <MiniMetricCard
            icon={TrendingUp}
            label="Speed"
            value={`${tokensPerSec} tok/s`}
            accent="text-purple-500"
          />
          <MiniMetricCard
            icon={Zap}
            label="Time to First Token"
            value={log.ttft_ms != null ? `${Math.round(log.ttft_ms)}ms` : "-"}
            accent={
              log.ttft_ms != null
                ? log.ttft_ms < 500
                  ? "text-emerald-500"
                  : log.ttft_ms < 2000
                    ? "text-amber-500"
                    : "text-red-500"
                : "text-muted-foreground"
            }
          />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Token Breakdown
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Input</span>
                <span className="font-medium">{formatNumber(inputTokens)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-muted-foreground">Output</span>
                <span className="font-medium">
                  {formatNumber(outputTokens)}
                </span>
              </div>
              {log.cached_tokens != null && log.cached_tokens > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-muted-foreground">Cached</span>
                  <span className="font-medium">
                    {formatNumber(log.cached_tokens)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {chatMessageCount > 0 && messageThread ? (
          <CollapsibleSection
            title={`Messages (${chatMessageCount})`}
            icon={MessageSquare}
            defaultOpen={true}
          >
            <ReadonlyInteractionThread
              thread={messageThread}
              resolveRawPayload={resolveRawPayload}
              className="max-h-96 overflow-y-auto rounded-lg border bg-muted/10 p-2"
            />
          </CollapsibleSection>
        ) : null}

        {log.request_body && Object.keys(log.request_body).length > 0 ? (
          <CollapsibleSection
            title="Request Body"
            icon={MessageSquare}
            defaultOpen={false}
          >
            <JsonViewer data={log.request_body} defaultOpen={false} />
          </CollapsibleSection>
        ) : null}

        {isSuccess &&
        log.response_body &&
        Object.keys(log.response_body).length > 0 ? (
          <CollapsibleSection
            title="Response Body"
            icon={FileText}
            defaultOpen={false}
          >
            <JsonViewer data={log.response_body} defaultOpen={false} />
          </CollapsibleSection>
        ) : null}

        {!isSuccess ? (
          <section className="overflow-hidden rounded-lg border border-red-500/30">
            <div className="border-b bg-red-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Details
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-500/15 text-red-700 border-red-500/30">
                  {log.status}
                </Badge>
                {log.error_type ? (
                  <Badge variant="outline">{log.error_type}</Badge>
                ) : null}
              </div>
              <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded font-mono overflow-x-auto">
                {log.error_message ??
                  (log.response_body
                    ? JSON.stringify(log.response_body, null, 2)
                    : "No error details available")}
              </pre>
            </div>
          </section>
        ) : null}

        <LogDetailInfoSections
          log={log}
          statusConfig={statusConfig}
          durationMs={durationMs}
          tokensPerSec={tokensPerSec}
        />
      </DialogContent>
    </Dialog>
  );
}
