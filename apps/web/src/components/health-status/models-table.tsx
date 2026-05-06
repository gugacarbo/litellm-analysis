import { Loader2 } from "lucide-react";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../../pages/health-status/health-status-utils";
import type { ModelWithStatus } from "../../pages/health-status/use-health-status-state";
import { Button } from "../ui/button";
import { StatusBadge } from "./status-badge";

interface ModelsTableProps {
  models: ModelWithStatus[];
  isLoading: boolean;
  isError: boolean;
  isGlobalRunning: boolean;
  isModelRunning: (modelName: string) => boolean;
  onSelect: (model: ModelWithStatus) => void;
  onTest: (modelName: string) => void;
}

export function ModelsTable({
  models,
  isLoading,
  isError,
  isGlobalRunning,
  isModelRunning,
  onSelect,
  onTest,
}: ModelsTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading latest checks...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Failed to load latest health check results.
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No models configured.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-9 px-3 text-start text-xs font-medium text-muted-foreground">
              Model
            </th>
            <th className="h-9 w-[170px] px-3 text-start text-xs font-medium text-muted-foreground">
              Latency / HTTP
            </th>
            <th className="h-9 w-[180px] px-3 text-start text-xs font-medium text-muted-foreground">
              TTFT / Tokens/s
            </th>
            <th className="h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground">
              Last Check
            </th>
            <th className="h-9 w-[80px] px-3 text-center text-xs font-medium text-muted-foreground">
              Test
            </th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const modelIsRunning = isModelRunning(model.modelName);
            const isIndividualButtonDisabled =
              isGlobalRunning || modelIsRunning;
            const displayStatus = isIndividualButtonDisabled
              ? "checking"
              : model.status;

            return (
              <tr
                key={model.modelName}
                className="border-b transition-colors hover:bg-muted/20 last:border-0"
              >
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="rounded"
                    onClick={() => onSelect(model)}
                  >
                    <StatusBadge status={displayStatus} />
                  </button>
                </td>
                <td className="max-w-[260px] truncate px-3 py-2 font-medium">
                  {model.modelName}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums">
                      {formatResponseTime(model.responseTimeMs)}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {model.statusCode ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs tabular-nums">
                      {formatResponseTime(model.ttftMs)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {formatTokensPerSecond(model.tokensPerSecond)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {model.checkedAt ? (
                    <span title={formatTimestamp(model.checkedAt)}>
                      {formatRelativeTime(model.checkedAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => onTest(model.modelName)}
                    disabled={isIndividualButtonDisabled}
                  >
                    Test
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
