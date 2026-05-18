import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getAllModels } from "@/shared/lib/api-client/models";
import { queryKeys } from "@/shared/lib/query-keys";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useLogs } from "../hooks/use-logs";
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
    <PageLayout
      title="Logs & Errors"
      subtitle="Request-level costs, usage, and latency diagnostics."
      icon={FileText}
    >
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
    </PageLayout>
  );
}
