import { Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { ModelWithStatus } from "../hooks/use-health-status-state";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../utils/health-status-utils";
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32.5">Status</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="w-42.5">Latency / HTTP</TableHead>
            <TableHead className="w-30">TTFT</TableHead>
            <TableHead className="w-25">Tokens/s</TableHead>
            <TableHead className="w-30">Last Check</TableHead>
            <TableHead className="w-20 text-center">Test</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => {
            const modelIsRunning =
              isGlobalRunning || isModelRunning(model.modelName);
            const isIndividualButtonDisabled = modelIsRunning;
            const displayStatus = modelIsRunning ? "checking" : model.status;

            return (
              <TableRow key={model.modelName}>
                <TableCell>
                  <button
                    type="button"
                    className="rounded"
                    onClick={() => onSelect(model)}
                  >
                    <StatusBadge status={displayStatus} />
                  </button>
                </TableCell>
                <TableCell className="max-w-65 truncate font-medium">
                  {model.modelName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums">
                      {formatResponseTime(model.responseTimeMs)}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {model.statusCode ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatResponseTime(model.ttftMs)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums whitespace-nowrap">
                  {formatTokensPerSecond(model.tokensPerSecond)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {model.checkedAt ? (
                    <span title={formatTimestamp(model.checkedAt)}>
                      {formatRelativeTime(model.checkedAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => onTest(model.modelName)}
                    disabled={isIndividualButtonDisabled}
                  >
                    {modelIsRunning ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
