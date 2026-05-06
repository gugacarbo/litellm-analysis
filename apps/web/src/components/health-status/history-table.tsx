import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { HealthCheckResultEntry } from "../../pages/health-status/health-status-types";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../../pages/health-status/health-status-utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { StatusBadge } from "./status-badge";

interface HistoryTableProps {
  entries: HealthCheckResultEntry[];
  isLoading: boolean;
  isError: boolean;
  total: number;
  offset: number;
  page: number;
  totalPages: number;
  start: number;
  end: number;
  onSelect: (entry: HealthCheckResultEntry) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function HistoryTable({
  entries,
  isLoading,
  isError,
  total,
  offset,
  page,
  totalPages,
  start,
  end,
  onSelect,
  onPrevPage,
  onNextPage,
}: HistoryTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading history...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Failed to load health check history.
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No history available.
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
            <th className="h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground">
              Latency
            </th>
            <th className="h-9 w-[120px] px-3 text-start text-xs font-medium text-muted-foreground">
              TTFT
            </th>
            <th className="h-9 w-[130px] px-3 text-start text-xs font-medium text-muted-foreground">
              Tokens/s
            </th>
            <th className="h-9 w-[90px] px-3 text-start text-xs font-medium text-muted-foreground">
              HTTP
            </th>
            <th className="h-9 w-[100px] px-3 text-start text-xs font-medium text-muted-foreground">
              Source
            </th>
            <th className="h-9 px-3 text-start text-xs font-medium text-muted-foreground">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b transition-colors hover:bg-muted/20 last:border-0"
            >
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="rounded"
                  onClick={() => onSelect(entry)}
                >
                  <StatusBadge status={entry.status} />
                </button>
              </td>
              <td className="max-w-[260px] truncate px-3 py-2 font-medium">
                {entry.modelName}
              </td>
              <td className="px-3 py-2 font-mono text-xs tabular-nums">
                {formatResponseTime(entry.responseTimeMs)}
              </td>
              <td className="px-3 py-2 font-mono text-xs tabular-nums">
                {formatResponseTime(entry.ttftMs)}
              </td>
              <td className="px-3 py-2 font-mono text-xs tabular-nums">
                {formatTokensPerSecond(entry.tokensPerSecond)}
              </td>
              <td className="px-3 py-2 text-xs tabular-nums">
                {entry.statusCode ?? "—"}
              </td>
              <td className="px-3 py-2">
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {entry.source}
                </Badge>
              </td>
              <td
                className="px-3 py-2 text-xs text-muted-foreground"
                title={formatTimestamp(entry.checkedAt)}
              >
                {formatRelativeTime(entry.checkedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          Showing {start}–{end} of {total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={offset === 0}
            onClick={onPrevPage}
          >
            <ChevronLeft className="size-3.5" />
            Prev
          </Button>
          <span className="px-1 text-xs tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={end >= total}
            onClick={onNextPage}
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
