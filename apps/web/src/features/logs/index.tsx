import { FileText, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { useFilter } from "@/shared/contexts/filter-context";
import { getDateRangeLabel } from "@/shared/lib/date-ranges";
import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";
import { LogsSummaryCards } from "./components/logs-summary-cards";
import { LogsTable } from "./components/logs-table";
import { useLogsData } from "./hooks/use-logs-data";

export function LogsPage() {
  const { dateRange } = useFilter();
  const rangeLabel = getDateRangeLabel(dateRange);

  const {
    logs,
    loading,
    refreshing,
    error,
    page,
    pageSize,
    setPage,
    setPageSize,
    visibleColumns,
    toggleColumn,
    autoRefetchEnabled,
    setAutoRefetchEnabled,
    groupByModel,
    setGroupByModel,
    pagination,
    refetch,
  } = useLogsData();

  const lastUpdatedLabel = useMemo(() => {
    if (loading) return "--";
    return new Date().toLocaleTimeString(APP_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    });
  }, [loading]);

  return (
    <PageLayout
      title="Request Logs"
      subtitle={`Filtered by: ${rangeLabel}`}
      icon={FileText}
      buttons={
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            Auto: {autoRefetchEnabled ? "5s" : "Off"}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {lastUpdatedLabel}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw
              className={`mr-1.5 h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <LogsSummaryCards logs={logs} loading={loading} />

      <LogsTable
        logs={logs}
        loading={loading}
        refreshing={refreshing}
        page={page}
        pageSize={pageSize}
        pagination={pagination}
        visibleColumns={visibleColumns}
        autoRefetchEnabled={autoRefetchEnabled}
        groupByModel={groupByModel}
        onToggleColumn={toggleColumn}
        onAutoRefetchChange={setAutoRefetchEnabled}
        onGroupByModelChange={setGroupByModel}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(Number(size));
          setPage(1);
        }}
        onRefetch={refetch}
      />
    </PageLayout>
  );
}
