import type { SpendLog } from "@lite-llm/contracts/analytics";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  MessageCircle,
  MessageSquare,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { CollapsibleSection } from "@/shared/components/ui/collapsible-section";
import { JsonViewer } from "@/shared/components/ui/json-viewer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
} from "@/shared/lib/spend-log-utils";
import { extractLogMessages } from "../utils/extract-log-messages";
import { ChatSimulation } from "./chat-simulation";
import { ContextBadge } from "./log-detail-context-badge";
import { LogDetailInfoSections } from "./log-detail-info-section";
import { MiniMetricCard } from "./log-detail-metric-card";

type LogDetailContentProps = {
  log: SpendLog;
};

export function LogDetailContent({ log }: LogDetailContentProps) {
  const [copied, setCopied] = useState(false);

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

  const handleCopyRequestId = async () => {
    await navigator.clipboard.writeText(log.request_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contextBadges: {
    label: string;
    icon: typeof MessageSquare;
    variant: "success" | "info" | "warning" | "purple" | "cyan" | "default";
  }[] = [];

  if (log.call_type) {
    contextBadges.push({
      label: log.call_type.replace(/_/g, " ").replace(/\./g, " "),
      icon: MessageSquare,
      variant: "info",
    });
  }

  if (log.cache_hit) {
    contextBadges.push({
      label: log.cache_hit === "true" ? "Cache Hit" : "Cache Miss",
      icon: Zap,
      variant: log.cache_hit === "true" ? "success" : "warning",
    });
  }

  if (log.messages && log.messages.length > 0) {
    contextBadges.push({
      label: "Chat",
      icon: MessageSquare,
      variant: "purple",
    });
  }

  if (log.cache_hit || log.response) {
    contextBadges.push({
      label: "Streaming",
      icon: Zap,
      variant: "cyan",
    });
  }

  const hasContextBadges = contextBadges.length > 0;
  const rawMessages = extractLogMessages(log);
  const hasMessages = rawMessages != null && rawMessages.length > 0;

  const detailsTab = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${statusConfig.bg}`}
        >
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-mono text-sm sm:text-base break-all pr-4">
            {log.model}
          </h2>
          <p className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            <span>{formatFullDateTime(log.start_time)}</span>
            <span className="text-muted-foreground/50">&bull;</span>
            <span>{formatDuration(durationMs)}</span>
            {log.call_type && (
              <>
                <span className="text-muted-foreground/50">&bull;</span>
                <span className="capitalize">
                  {log.call_type.replace(/_/g, " ")}
                </span>
              </>
            )}
          </p>
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
        <span className="font-mono text-xs break-all flex-1">
          {log.request_id}
        </span>
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
      </div>

      {hasContextBadges && (
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
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniMetricCard
          icon={DollarSign}
          label="Total Spend"
          value={formatCurrency(log.spend)}
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
          value={formatNumber(log.total_tokens)}
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
          value={
            log.time_to_first_token_ms != null
              ? `${Math.round(log.time_to_first_token_ms)}ms`
              : "-"
          }
          accent={
            log.time_to_first_token_ms != null
              ? log.time_to_first_token_ms < 500
                ? "text-emerald-500"
                : log.time_to_first_token_ms < 2000
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
          <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden flex">
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

      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <CollapsibleSection
          title="Metadata"
          icon={MessageSquare}
          defaultOpen={false}
        >
          <JsonViewer data={log.metadata} defaultOpen={false} />
        </CollapsibleSection>
      )}

      {log.request_tags && log.request_tags.length > 0 && (
        <CollapsibleSection title="Request Tags" icon={Zap} defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {log.request_tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {log.proxy_server_request &&
        typeof log.proxy_server_request === "object" &&
        Object.keys(log.proxy_server_request).length > 0 && (
          <CollapsibleSection
            title="Request Body"
            icon={MessageSquare}
            defaultOpen={false}
          >
            <JsonViewer data={log.proxy_server_request} defaultOpen={false} />
          </CollapsibleSection>
        )}

      {isSuccess &&
        log.response &&
        typeof log.response === "object" &&
        Object.keys(log.response).length > 0 && (
          <CollapsibleSection
            title="Response"
            icon={FileText}
            defaultOpen={false}
          >
            <JsonViewer data={log.response} defaultOpen={false} />
          </CollapsibleSection>
        )}

      {!isSuccess && (
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
            </div>
            <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded font-mono overflow-x-auto">
              {log.response
                ? JSON.stringify(log.response, null, 2)
                : "No error details available"}
            </pre>
          </div>
        </section>
      )}

      <LogDetailInfoSections
        log={log}
        statusConfig={statusConfig}
        durationMs={durationMs}
        tokensPerSec={tokensPerSec}
      />
    </div>
  );

  const chatTab = hasMessages ? (
    <ChatSimulation
      messages={rawMessages}
      mcpNamespacedToolName={log.mcp_namespaced_tool_name}
    />
  ) : (
    <div className="flex flex-col items-center justify-center h-48 text-sm text-muted-foreground gap-2">
      <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
      <p>No messages available for this log</p>
    </div>
  );

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">
          <FileText className="h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="chat">
          <MessageCircle className="h-4 w-4" />
          Chat
          {hasMessages && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              ({rawMessages.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details">{detailsTab}</TabsContent>
      <TabsContent value="chat">{chatTab}</TabsContent>
    </Tabs>
  );
}
