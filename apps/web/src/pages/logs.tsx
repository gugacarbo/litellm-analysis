import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { useLogs } from "../hooks/use-logs";
import { getAllModels } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { SpendLogsTab } from "./logs/spend-logs-tab";
import { LogsErrorsTab } from "./logs-errors-tab";

export function LogsPage() {
  const {
    logs,
    pagination,
    loading,
    refreshing,
    error,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch,
  } = useLogs();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "errors" ? "errors" : "spend";

  const handleTabChange = (tab: string) => {
    if (tab === "errors") {
      setSearchParams({ tab: "errors" });
    } else {
      setSearchParams({});
    }
  };

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Logs & Errors</h1>
        <p className="text-sm text-muted-foreground">
          Request-level costs, usage, and latency diagnostics.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="spend">Logs</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="spend" className="mt-6">
          <SpendLogsTab
            logs={logs}
            pagination={pagination}
            loading={loading}
            refreshing={refreshing}
            error={error}
            modelsQuery={modelsQuery}
            page={page}
            pageSize={pageSize}
            filters={filters}
            setPage={setPage}
            setPageSize={setPageSize}
            setFilters={setFilters}
            refetch={refetch}
          />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <LogsErrorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
