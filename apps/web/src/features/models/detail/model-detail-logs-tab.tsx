import type { PaginationMetadata } from "@lite-llm/contracts/analytics";
import { useState } from "react";
import { LogDetailDialog } from "@/features/logs/components/log-detail-dialog";
import { LogsSummaryCards } from "@/features/logs/components/logs-summary-cards";
import {
  DEFAULT_VISIBLE_LOG_COLUMNS,
  LogsTable,
} from "@/features/logs/components/logs-table";
import type { LogColumnKey } from "@/features/logs/components/logs-table-columns";
import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";

interface ModelDetailLogsTabProps {
  logs: ProxyRequestLog[];
  pagination: PaginationMetadata;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
}

export function ModelDetailLogsTab({
  logs,
  pagination,
  loading,
  refreshing,
  error,
  page,
  pageSize,
  setPage,
  setPageSize,
  refetch,
}: ModelDetailLogsTabProps) {
  const [selectedLog, setSelectedLog] = useState<ProxyRequestLog | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<LogColumnKey[]>(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );

  const handlePageChange = (newPage: number) => {
    const totalPages = pagination.total_pages || 1;
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const parsedPageSize = Number(newPageSize);
    if (Number.isNaN(parsedPageSize)) return;
    setPageSize(parsedPageSize);
    setPage(1);
  };

  const handleToggleColumn = (column: LogColumnKey) => {
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        if (currentColumns.length === 1) return currentColumns;
        return currentColumns.filter((key) => key !== column);
      }
      return [...currentColumns, column];
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            Error loading logs: {error}
          </p>
        </div>
      )}

      <LogsSummaryCards logs={logs} loading={loading} />

      <LogsTable
        logs={logs}
        loading={loading}
        refreshing={refreshing}
        page={page}
        pageSize={pageSize}
        pagination={pagination}
        visibleColumns={visibleColumns}
        autoRefetchEnabled={false}
        groupByModel={false}
        onSelectLog={setSelectedLog}
        onToggleColumn={handleToggleColumn}
        onAutoRefetchChange={() => {}}
        onGroupByModelChange={() => {}}
        onRefetch={() => {
          void refetch();
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <LogDetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </div>
  );
}
