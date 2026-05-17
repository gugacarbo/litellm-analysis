import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  MessageSquare,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatDetailsTab } from "@/components/logs/chat-details-tab";
import { LogDetailInfoSections } from "@/components/logs/log-detail-info-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JsonViewer } from "@/components/ui/json-viewer";
import { PageLayout } from "@/components/ui/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateTokensPerSecond,
  formatCurrency,
  formatDuration,
  formatFullDateTime,
  formatNumber,
} from "@/lib/spend-log-utils";
import { useRequestDetailPage } from "./use-request-detail-page";

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { log } = useRequestDetailPage(requestId ?? "");
  const [copied, setCopied] = useState(false);

  if (!requestId) {
    return (
      <PageLayout title="Request Detail" subtitle="Invalid request ID">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No request ID provided</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  if (log.isLoading) {
    return (
      <PageLayout
        title="Request Detail"
        subtitle={requestId}
        buttons={
          <Button variant="ghost" size="sm" onClick={() => navigate("/logs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Button>
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </PageLayout>
    );
  }

  if (log.isError || !log.data) {
    return (
      <PageLayout
        title="Request Detail"
        subtitle={requestId}
        buttons={
          <Button variant="ghost" size="sm" onClick={() => navigate("/logs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Button>
        }
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium">Failed to load request</p>
              <p className="text-sm text-muted-foreground mt-1">
                {log.error?.message ?? "Unknown error"}
              </p>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const spendLog = log.data;

  const durationMs =
    new Date(spendLog.end_time).getTime() -
    new Date(spendLog.start_time).getTime();
  const tokensPerSec = calculateTokensPerSecond(
    spendLog.completion_tokens,
    spendLog.start_time,
    spendLog.end_time,
  );
  const isSuccess = spendLog.status === "200" || spendLog.status === "success";

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
    await navigator.clipboard.writeText(spendLog.request_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageLayout
      title={spendLog.model}
      subtitle={formatFullDateTime(spendLog.start_time)}
      buttons={
        <Button variant="ghost" size="sm" onClick={() => navigate("/logs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Logs
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Status Header */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${statusConfig.bg}`}
              >
                <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={isSuccess ? "secondary" : "destructive"}>
                    {spendLog.status}
                  </Badge>
                  <Badge variant="outline">
                    {spendLog.user || "anonymous"}
                  </Badge>
                  {spendLog.call_type && (
                    <Badge variant="outline">
                      {spendLog.call_type.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-3 max-w-full">
                <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">
                  Request ID
                </span>
                <span className="font-mono text-xs break-all flex-1">
                  {spendLog.request_id}
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
            </div>
          </CardContent>
        </Card>

        {/* Metrics Summary */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  Total Spend
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(spendLog.spend)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Duration</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatDuration(durationMs)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  Total Tokens
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatNumber(spendLog.total_tokens)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Speed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{tokensPerSec} tok/s</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-500" />
                <span className="text-xs text-muted-foreground">
                  Time to First
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {spendLog.time_to_first_token_ms != null
                  ? `${Math.round(spendLog.time_to_first_token_ms)}ms`
                  : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Token Breakdown */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Prompt</span>
                <span className="font-medium">
                  {formatNumber(spendLog.prompt_tokens)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">
                  {formatNumber(spendLog.completion_tokens)}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                <span>Ratio</span>
                <span className="font-medium text-foreground">
                  {spendLog.prompt_tokens > 0
                    ? (
                        spendLog.completion_tokens / spendLog.prompt_tokens
                      ).toFixed(2)
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
                    spendLog.total_tokens > 0
                      ? (spendLog.prompt_tokens / spendLog.total_tokens) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{
                  width: `${
                    spendLog.total_tokens > 0
                      ? (spendLog.completion_tokens / spendLog.total_tokens) *
                        100
                      : 50
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Details
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <FileText className="h-4 w-4 mr-2" />
              Metrics &amp; Cost
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <ChatDetailsTab log={spendLog} />
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                {spendLog.metadata &&
                  Object.keys(spendLog.metadata).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Metadata</h3>
                      <JsonViewer
                        data={spendLog.metadata}
                        defaultOpen={false}
                      />
                    </div>
                  )}

                {spendLog.request_tags && spendLog.request_tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Request Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {spendLog.request_tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {spendLog.proxy_server_request &&
                  typeof spendLog.proxy_server_request === "object" &&
                  Object.keys(spendLog.proxy_server_request).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Request Body</h3>
                      <JsonViewer
                        data={spendLog.proxy_server_request}
                        defaultOpen={false}
                      />
                    </div>
                  )}

                {isSuccess &&
                  spendLog.response &&
                  typeof spendLog.response === "object" &&
                  Object.keys(spendLog.response).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Response</h3>
                      <JsonViewer
                        data={spendLog.response}
                        defaultOpen={false}
                      />
                    </div>
                  )}

                {!isSuccess && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                    <h3 className="text-sm font-medium mb-2 text-red-700 dark:text-red-400">
                      Error Details
                    </h3>
                    <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded font-mono overflow-x-auto">
                      {spendLog.response
                        ? JSON.stringify(spendLog.response, null, 2)
                        : "No error details available"}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <LogDetailInfoSections
          log={spendLog}
          statusConfig={statusConfig}
          durationMs={durationMs}
          tokensPerSec={tokensPerSec}
        />
      </div>
    </PageLayout>
  );
}
