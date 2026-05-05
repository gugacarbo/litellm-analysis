import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getHealthCheckResults,
  getHealthCheckSummary,
  getLatestHealthChecks,
} from "../../lib/api-client/health-check";
import { getAllModels } from "../../lib/api-client/models";
import { queryKeys } from "../../lib/query-keys";
import type {
  HealthCheckResultEntry,
  HealthCheckSummaryData,
} from "./health-status-types";
import { useHealthStatusWebSocket } from "./use-health-status-websocket";

const REFETCH_INTERVAL = 30_000;

export type HealthStatusTab = "status" | "history" | "summary";

export interface ModelWithStatus {
  modelName: string;
  status: HealthCheckResultEntry["status"];
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: number | null;
  source: HealthCheckResultEntry["source"] | null;
}

interface UseHealthStatusStateResult {
  latestQuery: ReturnType<
    typeof useQuery<{ checks: HealthCheckResultEntry[] }>
  >;
  summaryQuery: ReturnType<typeof useQuery<HealthCheckSummaryData>>;
  resultsQuery: ReturnType<
    typeof useQuery<{
      checks: HealthCheckResultEntry[];
      total: number;
      limit: number;
      offset: number;
    }>
  >;
  wsStatus: string;
  wsResults: HealthCheckResultEntry[] | null;
  allModelsWithStatus: ModelWithStatus[];
  resultsLimit: number;
  resultsOffset: number;
  setResultsOffset: (offset: number) => void;
  activeTab: HealthStatusTab;
  setActiveTab: (tab: HealthStatusTab) => void;
}

export function useHealthStatusState(): UseHealthStatusStateResult {
  const [activeTab, setActiveTab] = useState<HealthStatusTab>("status");
  const { status: wsStatus, latestResults: wsResults } =
    useHealthStatusWebSocket();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
    refetchInterval: REFETCH_INTERVAL,
  });

  const latestQuery = useQuery({
    queryKey: queryKeys.healthCheckLatest,
    queryFn: getLatestHealthChecks,
    refetchInterval: REFETCH_INTERVAL,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.healthCheckSummary,
    queryFn: getHealthCheckSummary,
    refetchInterval: REFETCH_INTERVAL,
  });

  const resultsLimit = 50;
  const [resultsOffset, setResultsOffset] = useState(0);

  const resultsQuery = useQuery({
    queryKey: queryKeys.healthCheckResults({
      limit: resultsLimit,
      offset: resultsOffset,
    }),
    queryFn: () =>
      getHealthCheckResults({ limit: resultsLimit, offset: resultsOffset }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const allModelNames = modelsQuery.data ?? [];
  const latestData = latestQuery.data?.checks ?? [];
  const wsLatest = wsResults ?? [];

  const checkMap = new Map<string, HealthCheckResultEntry>();
  for (const c of wsLatest) checkMap.set(c.modelName, c);
  for (const c of latestData) {
    if (!checkMap.has(c.modelName)) checkMap.set(c.modelName, c);
  }

  const allModelsWithStatus: ModelWithStatus[] = allModelNames.map((m) => {
    const check = checkMap.get(m.modelName);
    return check
      ? {
          modelName: m.modelName,
          status: check.status,
          responseTimeMs: check.responseTimeMs,
          statusCode: check.statusCode,
          errorMessage: check.errorMessage,
          checkedAt: check.checkedAt,
          source: check.source,
        }
      : {
          modelName: m.modelName,
          status: "unknown" as HealthCheckResultEntry["status"],
          responseTimeMs: null,
          statusCode: null,
          errorMessage: null,
          checkedAt: null,
          source: null,
        };
  });

  return {
    latestQuery,
    summaryQuery,
    resultsQuery,
    wsStatus,
    wsResults,
    allModelsWithStatus,
    resultsLimit,
    resultsOffset,
    setResultsOffset,
    activeTab,
    setActiveTab,
  };
}
