import { MessageSquareText } from "lucide-react";
import { useMemo } from "react";
import {
  LiveHealthCheckThread,
  ReadonlyInteractionThread,
} from "@/shared/components/automatic-interactions";
import { DetailRow } from "@/shared/components/ui/detail-row";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { normalizeHealthCheckThread } from "@/shared/lib/automatic-interactions";
import type { ModelWithStatus } from "../hooks/use-health-status-state";
import type { RunningHealthCheckExecution } from "../hooks/use-health-status-websocket";
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

function executionIdFor(
  selected: ModelWithStatus | HealthCheckResultEntry,
): string {
  if (selected.id != null) {
    return String(selected.id);
  }
  return selected.modelName;
}

export function StatusDetailsDialog({
  selected,
  runningExecutions,
  partialMessages,
  onClose,
}: {
  selected: ModelWithStatus | HealthCheckResultEntry | null;
  runningExecutions: Map<string, RunningHealthCheckExecution>;
  partialMessages: Map<string, string>;
  onClose: () => void;
}) {
  const runningExecution = selected
    ? runningExecutions.get(selected.modelName)
    : undefined;

  const readonlyThread = useMemo(() => {
    if (!selected || runningExecution) {
      return null;
    }

    return normalizeHealthCheckThread({
      executionId: executionIdFor(selected),
      prompt: selected.promptSent ?? "",
      assistantText: selected.responseReceived,
      isRunning: false,
      timestamp: selected.checkedAt ?? undefined,
    });
  }, [runningExecution, selected]);

  const liveThread = useMemo(() => {
    if (!selected || !runningExecution) {
      return null;
    }

    return normalizeHealthCheckThread({
      executionId: runningExecution.executionId,
      prompt: runningExecution.prompt,
      isRunning: true,
      partialAssistantText:
        partialMessages.get(runningExecution.executionId) ?? "",
      timestamp: runningExecution.startedAt,
    });
  }, [partialMessages, runningExecution, selected]);

  if (!selected) return null;

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
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
              value={
                <span className="uppercase">{selected.source ?? "—"}</span>
              }
              mono
            />
          </dl>

          <div className="rounded-md border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquareText className="size-3.5" />
              Conversation
            </div>
            <div className="max-h-72 overflow-auto rounded bg-muted/50">
              {liveThread ? (
                <LiveHealthCheckThread
                  executionId={liveThread.id}
                  initialThread={liveThread}
                  className="min-h-48"
                />
              ) : readonlyThread ? (
                <ReadonlyInteractionThread
                  thread={readonlyThread}
                  className="min-h-48"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                  No conversation available
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              Prompt sent
            </div>
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
    </Dialog>
  );
}
