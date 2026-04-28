import {
  AlertTriangle,
  Clock,
  Code2,
  Cpu,
  DollarSign,
  Hash,
  KeyRound,
  User,
} from "lucide-react";
import {
  formatDateTime,
  formatDuration,
  formatFullDateTime,
} from "../../lib/spend-log-utils";
import type { ErrorLog } from "../../types/analytics";
import { Badge } from "../badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog";

type ErrorDetailDialogProps = {
  errorLog: ErrorLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getStatusBadgeClass(statusCode: number): string {
  if (statusCode >= 500) {
    return "bg-red-500/15 text-red-700 border-red-500/30";
  }

  if (statusCode >= 400) {
    return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  }

  return "bg-muted text-muted-foreground";
}

function getErrorTypeBadgeClass(type: string): string {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("rate")) {
    return "bg-sky-500/15 text-sky-700 border-sky-500/30";
  }

  if (normalizedType.includes("timeout")) {
    return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
  }

  if (normalizedType.includes("auth") || normalizedType.includes("key")) {
    return "bg-red-500/15 text-red-700 border-red-500/30";
  }

  return "bg-muted text-muted-foreground";
}

function getSpendStatusBadgeClass(status: string): string {
  const normalizedStatus = status?.toLowerCase() || "";
  if (normalizedStatus === "success" || normalizedStatus === "completed") {
    return "bg-green-500/15 text-green-700 border-green-500/30";
  }
  if (normalizedStatus === "error" || normalizedStatus === "failed") {
    return "bg-red-500/15 text-red-700 border-red-500/30";
  }
  if (normalizedStatus === "pending" || normalizedStatus === "processing") {
    return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  }
  return "bg-muted text-muted-foreground";
}

export function ErrorDetailDialog({
  errorLog,
  open,
  onOpenChange,
}: ErrorDetailDialogProps) {
  if (!errorLog) return null;
  const statusCode = errorLog.status_code || 0;
  const errorType = errorLog.error_type || "Error";
  const errorMessage = errorLog.error_message || "-";
  const apiKey = errorLog.api_key;
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
              <div className="mt-1">
                <Badge
                  variant="secondary"
                  className={getSpendStatusBadgeClass(spendStatus)}
                >
                  {spendStatus}
                </Badge>
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

        {errorLog.total_tokens != null && errorLog.total_tokens > 0 && (
          <section className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Partial Usage (Before Error)
            </div>
            <div className="p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    Tokens Used
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {errorLog.total_tokens?.toLocaleString("en-US") || "-"}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    Spend Incurred
                  </div>
                  <div className="mt-1 text-sm font-medium text-amber-600">
                    {errorLog.spend != null
                      ? `$${errorLog.spend.toFixed(4)}`
                      : "-"}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Time to Error
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {errorLog.end_time && errorLog.timestamp
                      ? formatDuration(
                          new Date(errorLog.end_time).getTime() -
                            new Date(errorLog.timestamp).getTime(),
                        )
                      : "-"}
                  </div>
                </div>
              </div>

              {(errorLog.prompt_tokens != null ||
                errorLog.completion_tokens != null) && (
                <div className="mt-3">
                  <div className="flex items-center gap-4 text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      <span className="text-muted-foreground">
                        Prompt:{" "}
                        {errorLog.prompt_tokens?.toLocaleString("en-US") || "0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      <span className="text-muted-foreground">
                        Completion:{" "}
                        {errorLog.completion_tokens?.toLocaleString("en-US") ||
                          "0"}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                    {errorLog.total_tokens != null &&
                      errorLog.total_tokens > 0 && (
                        <>
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{
                              width: `${
                                ((errorLog.prompt_tokens || 0) /
                                  errorLog.total_tokens) *
                                100
                              }%`,
                            }}
                          />
                          <div
                            className="bg-amber-500 h-full transition-all"
                            style={{
                              width: `${
                                ((errorLog.completion_tokens || 0) /
                                  errorLog.total_tokens) *
                                100
                              }%`,
                            }}
                          />
                        </>
                      )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Request Context
          </div>
          <dl className="divide-y divide-border">
            <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                Request ID
              </dt>
              <dd className="font-mono text-xs break-all">
                {errorLog.id || "-"}
              </dd>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                Model
              </dt>
              <dd className="text-sm break-all font-mono">
                {errorLog.model || "-"}
              </dd>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                User
              </dt>
              <dd className="text-sm break-all">{errorLog.user || "-"}</dd>
            </div>

            {apiKey && (
              <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" />
                  API Key
                </dt>
                <dd className="font-mono text-xs break-all">{apiKey}</dd>
              </div>
            )}
          </dl>
        </section>

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
