import { AlertTriangle, Clock, KeyRound, User } from "lucide-react";
import { formatDateTime, formatFullDateTime } from "../../lib/spend-log-utils";
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

export function ErrorDetailDialog({
  errorLog,
  open,
  onOpenChange,
}: ErrorDetailDialogProps) {
  if (!errorLog) return null;

  const statusCode = errorLog.status_code || 0;
  const errorType = errorLog.error_type || "Error";
  const errorMessage = errorLog.error_message || "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
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

        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

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
                <KeyRound className="h-3.5 w-3.5" />
                Model
              </dt>
              <dd className="text-sm break-all">{errorLog.model || "-"}</dd>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                User
              </dt>
              <dd className="text-sm break-all">{errorLog.user || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Error Message
          </div>
          <div className="px-3 py-3">
            <pre className="text-sm whitespace-pre-wrap break-words font-sans">
              {errorMessage}
            </pre>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
