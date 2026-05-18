import type { ErrorLog } from "@lite-llm/contracts/analytics";
import { AlertTriangle, Clock, Code2, Cpu, DollarSign } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  formatDateTime,
  formatFullDateTime,
} from "@/shared/lib/spend-log-utils";
import { ErrorDetailPartialUsage } from "./error-detail-partial-usage";
import { ErrorDetailRequestContext } from "./error-detail-request-context";
import { getErrorTypeBadgeClass, getStatusBadgeClass } from "./errors-utils";

type ErrorDetailDialogProps = {
  errorLog: ErrorLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ErrorDetailDialog({
  errorLog,
  open,
  onOpenChange,
}: ErrorDetailDialogProps) {
  if (!errorLog) return null;

  const statusCode = errorLog.status_code || 0;
  const errorType = errorLog.error_type || "Error";
  const errorMessage = errorLog.error_message || "-";
  const spendStatus = errorLog.spend_status;
  const hasRequestKwargs =
    errorLog.request_kwargs && Object.keys(errorLog.request_kwargs).length > 0;
  const showLiteLLMModel =
    errorLog.litellm_model_name &&
    errorLog.litellm_model_name !== errorLog.model;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-sm sm:text-base break-all">
              {errorType}
            </DialogTitle>
            <Badge
              variant="secondary"
              className={getStatusBadgeClass(statusCode)}
            >
              {statusCode || "N/A"}
            </Badge>
            <Badge
              variant="secondary"
              className={getErrorTypeBadgeClass(errorType)}
            >
              {errorType}
            </Badge>
          </div>
          <DialogDescription>
            Error happened at{" "}
            {errorLog.timestamp ? formatFullDateTime(errorLog.timestamp) : "-"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Timestamp
            </div>
            <div className="mt-1 text-sm font-medium">
              {errorLog.timestamp ? formatDateTime(errorLog.timestamp) : "-"}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Status Code
            </div>
            <div className="mt-1 text-sm font-medium">
              {statusCode || "N/A"}
            </div>
          </div>

          {spendStatus && (
            <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Spend Status
              </div>
              <div className="mt-1 text-sm">
                <Badge variant="secondary">{spendStatus}</Badge>
              </div>
            </div>
          )}

          {showLiteLLMModel && (
            <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                LiteLLM Model
              </div>
              <div className="mt-1 text-sm font-medium font-mono break-all">
                {errorLog.litellm_model_name}
              </div>
            </div>
          )}
        </div>

        <ErrorDetailPartialUsage errorLog={errorLog} />

        <ErrorDetailRequestContext errorLog={errorLog} />

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Error Message
          </div>
          <div className="px-3 py-3">
            <pre className="text-sm whitespace-pre-wrap wrap-break-word font-sans">
              {errorMessage}
            </pre>
          </div>
        </section>

        {hasRequestKwargs && (
          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5" />
                Request Parameters
              </div>
            </div>
            <div className="px-3 py-3">
              <pre className="max-h-80 overflow-auto rounded bg-muted/50 p-3 text-xs whitespace-pre-wrap wrap-break-word font-mono">
                {JSON.stringify(errorLog.request_kwargs, null, 2)}
              </pre>
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
