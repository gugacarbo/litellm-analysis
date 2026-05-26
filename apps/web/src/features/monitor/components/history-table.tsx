import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { HealthCheckResultEntry } from "../types/health-status-types";
import {
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  formatTokensPerSecond,
} from "../utils/health-status-utils";
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32.5">Status</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="w-30">Latency</TableHead>
            <TableHead className="w-30">TTFT</TableHead>
            <TableHead className="w-32.5">Tokens/s</TableHead>
            <TableHead className="w-22.5">HTTP</TableHead>
            <TableHead className="w-25">Source</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <button
                  type="button"
                  className="rounded"
                  onClick={() => onSelect(entry)}
                >
                  <StatusBadge status={entry.status} />
                </button>
              </TableCell>
              <TableCell className="max-w-65 truncate font-medium">
                {entry.modelName}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">
                {formatResponseTime(entry.responseTimeMs)}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">
                {formatResponseTime(entry.ttftMs)}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">
                {formatTokensPerSecond(entry.tokensPerSecond)}
              </TableCell>
              <TableCell className="text-xs tabular-nums">
                {entry.statusCode ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {entry.source}
                </Badge>
              </TableCell>
              <TableCell
                className="text-xs text-muted-foreground"
                title={formatTimestamp(entry.checkedAt)}
              >
                {formatRelativeTime(entry.checkedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
