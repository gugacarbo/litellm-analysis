import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { getSpendLogDetail } from "@/shared/lib/api-client/spend";
import { queryKeys } from "@/shared/lib/query-keys";
import { LogDetailContent } from "./components/log-detail-content";

export function LogDetailPage() {
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
      <PageLayout title="Log Detail" subtitle="Request not found">
        <p className="text-sm text-muted-foreground">
          Request ID não informado.
        </p>
      </PageLayout>
    );
  }

  const log = detailQuery.data;

  return (
    <PageLayout
      title="Log Detail"
      subtitle={
        log
          ? `${log.model} • ${log.request_id.slice(0, 16)}...`
          : `Request ${requestId.slice(0, 16)}...`
      }
      icon={FileText}
      showFilters={false}
      buttons={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/logs">
              <ArrowLeft className="h-4 w-4" />
              Back
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
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-muted rounded-lg"
              />
            ))}
          </div>
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      ) : detailQuery.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive font-medium mb-1">
            Failed to load log detail
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
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/logs">Return to Logs</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <LogDetailContent log={log} />
        </div>
      )}
    </PageLayout>
  );
}
