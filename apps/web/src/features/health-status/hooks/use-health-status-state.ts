import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getHealthCheckResults,
  getHealthCheckSummary,
  getLatestHealthChecks,
} from "@/shared/lib/api-client/health-check";
import { getAllModels } from "@/shared/lib/api-client/models";
import { queryKeys } from "@/shared/lib/query-keys";
import type {
  HealthCheckResultEntry,
  HealthCheckSummaryData,
} from "../health-status-types";
import { useHealthStatusWebSocket } from "./use-health-status-websocket";

const REFETCH_INTERVAL = 30_000;

export interface ModelWithStatus {
  id: number | null;
  modelName: string;
  status: HealthCheckResultEntry["status"];
  responseTimeMs: number | null;
  ttftMs: number | null;
  outputTokens: number | null;
  tokensPerSecond: number | null;
  statusCode: number | null;
  promptSent: string | null;
  responseReceived: string | null;
  requestPayload: string | null;
  responsePayload: string | null;
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
}

export function useHealthStatusState(): UseHealthStatusStateResult {
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

  const resultsLimit = 10;
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
          id: check.id,
          modelName: m.modelName,
          status: check.status,
          responseTimeMs: check.responseTimeMs,
          ttftMs: check.ttftMs,
          outputTokens: check.outputTokens,
          tokensPerSecond: check.tokensPerSecond,
          statusCode: check.statusCode,
          promptSent: check.promptSent,
          responseReceived: check.responseReceived,
          requestPayload: check.requestPayload,
          responsePayload: check.responsePayload,
          errorMessage: check.errorMessage,
          checkedAt: check.checkedAt,
          source: check.source,
        }
      : {
          id: null,
          modelName: m.modelName,
          status: "unknown" as HealthCheckResultEntry["status"],
          responseTimeMs: null,
          ttftMs: null,
          outputTokens: null,
          tokensPerSecond: null,
          statusCode: null,
          promptSent: null,
          responseReceived: null,
          requestPayload: null,
          responsePayload: null,
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
  };
}
