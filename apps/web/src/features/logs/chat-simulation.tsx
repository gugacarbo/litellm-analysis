import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { getSpendLogDetail } from "@/shared/lib/api-client/spend";
import { extractSpendLogMessages } from "@/shared/lib/automatic-interactions";
import { queryKeys } from "@/shared/lib/query-keys";
import { ChatSimulation } from "./components/chat-simulation";

export function LogChatSimulationPage() {
  const { requestId } = useParams<{ requestId: string }>();

  const detailQuery = useQuery({
    queryKey: queryKeys.spendLogDetail(requestId ?? ""),
    queryFn: () => {
      if (!requestId) throw new Error("Request ID not provided");
      return getSpendLogDetail(requestId);
    },
    enabled: !!requestId,
  });

  if (!requestId) {
    return (
      <PageLayout title="Chat Simulation" subtitle="Request not found">
        <p className="text-sm text-muted-foreground">
          Request ID não informado.
        </p>
      </PageLayout>
    );
  }

  const log = detailQuery.data;
  const hasMessages = log ? extractSpendLogMessages(log).length > 0 : false;

  return (
    <PageLayout
      title="Chat Simulation"
      subtitle={
        log
          ? `${log.model} • ${log.id.slice(0, 16)}...`
          : `Request ${requestId.slice(0, 16)}...`
      }
      icon={MessageCircle}
      showFilters={false}
      buttons={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/logs/${requestId}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Detail
            </Link>
          </Button>
          {detailQuery.isFetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </>
      }
    >
      {detailQuery.isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      ) : detailQuery.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive font-medium mb-1">
            Failed to load chat simulation
          </p>
          <p className="text-xs text-muted-foreground">
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      ) : !log ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive font-medium mb-1">
            Log not found
          </p>
          <p className="text-xs text-muted-foreground">
            No log found with request ID: {requestId}
          </p>
        </div>
      ) : hasMessages ? (
        <ChatSimulation log={log} />
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-sm text-muted-foreground gap-2">
          <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
          <p>No messages available for this log</p>
        </div>
      )}
    </PageLayout>
  );
}
