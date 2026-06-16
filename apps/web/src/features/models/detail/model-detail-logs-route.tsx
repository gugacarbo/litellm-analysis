import { useParams } from "react-router-dom";
import { ModelDetailLogsTab } from "./model-detail-logs-tab";
import { useModelDetailLogs } from "./use-model-detail-logs";

export function ModelDetailLogsRoute() {
  const { modelName } = useParams() as { modelName: string };
  const {
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
  } = useModelDetailLogs(modelName ?? "");

  return (
    <ModelDetailLogsTab
      logs={logs}
      pagination={pagination}
      loading={loading}
      refreshing={refreshing}
      error={error}
      page={page}
      pageSize={pageSize}
      setPage={setPage}
      setPageSize={setPageSize}
      refetch={refetch}
    />
  );
}