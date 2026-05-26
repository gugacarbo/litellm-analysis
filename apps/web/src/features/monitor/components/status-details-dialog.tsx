import { MessageSquareText } from "lucide-react";
import { DetailRow } from "@/shared/components/ui/detail-row";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { ModelWithStatus } from "../hooks/use-health-status-state";
import type { HealthCheckResultEntry } from "../types/health-status-types";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../utils/health-status-utils";
import { StatusBadge } from "./status-badge";

function formatPayload(payload: string | null): string {
  if (!payload) return "No payload";
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

export function StatusDetailsDialog({
  selected,
}: {
  selected: ModelWithStatus | HealthCheckResultEntry | null;
}) {
  if (!selected) return null;

  return (
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
      <DialogHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <DialogTitle className="flex items-center gap-2">
            Status Details
            <StatusBadge status={selected.status} />
          </DialogTitle>
          <DialogDescription>{selected.modelName}</DialogDescription>
        </div>
        <div className="pt-0.5 text-right">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Last check
          </div>
          {selected.checkedAt ? (
            <div className="mt-0.5 space-y-0.5">
              <div className="text-xs">
                {formatTimestamp(selected.checkedAt)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {formatRelativeTime(selected.checkedAt)}
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-xs">—</div>
          )}
        </div>
      </DialogHeader>

      <div className="space-y-3 text-sm">
        <dl className="divide-y divide-border rounded-lg border bg-muted/20">
          <DetailRow
            label="Latency"
            value={formatResponseTime(selected.responseTimeMs)}
            mono
          />
          <DetailRow
            label="TTFT"
            value={formatResponseTime(selected.ttftMs)}
            mono
          />
          <DetailRow
            label="Tokens/s"
            value={formatTokensPerSecond(selected.tokensPerSecond)}
            mono
          />
          <DetailRow
            label="Output tokens"
            value={selected.outputTokens ?? "—"}
            mono
          />
          <DetailRow label="HTTP" value={selected.statusCode ?? "—"} mono />
          <DetailRow
            label="Source"
            value={<span className="uppercase">{selected.source ?? "—"}</span>}
            mono
          />
        </dl>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">Prompt sent</div>
          <div className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 font-mono text-xs">
            {selected.promptSent ?? "No prompt"}
          </div>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">
            Response received
          </div>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 font-mono text-xs">
            {formatPayload(selected.responseReceived)}
          </pre>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">
            Request payload
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 font-mono text-xs">
            {formatPayload(selected.requestPayload)}
          </pre>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 text-xs text-muted-foreground">
            Full response payload
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 font-mono text-xs">
            {formatPayload(selected.responsePayload)}
          </pre>
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquareText className="size-3.5" />
            Error message
          </div>
          <div className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 font-mono text-xs">
            {selected.errorMessage ?? "No error"}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
