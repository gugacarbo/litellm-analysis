import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
} from "../types/health-status-types";
import { mergeLatestHealthChecks } from "../utils/health-status-utils";

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
  modelsQuery: ReturnType<
    typeof useQuery<import("@/shared/lib/api-client/models").ModelConfig[]>
  >;
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
  wsResults: HealthCheckResultEntry[];
  allModelsWithStatus: ModelWithStatus[];
  resultsLimit: number;
  resultsPage: number;
  setResultsPage: (page: number) => void;
  isLatestPage: boolean;
  historyOffset: number;
}

interface UseHealthStatusStateParams {
  wsStatus: string;
  wsResults: HealthCheckResultEntry[];
}

export function useHealthStatusState({
  wsStatus,
  wsResults,
}: UseHealthStatusStateParams): UseHealthStatusStateResult {
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

  const allModelNames = modelsQuery.data ?? [];
  const resultsLimit = Math.max(allModelNames.length, 1);
  const [resultsPage, setResultsPage] = useState(0);
  const isLatestPage = resultsPage === 0;
  const historyOffset = isLatestPage ? 0 : (resultsPage - 1) * resultsLimit;

  const resultsQuery = useQuery({
    queryKey: queryKeys.healthCheckResults({
      limit: resultsLimit,
      offset: historyOffset,
    }),
    queryFn: () =>
      getHealthCheckResults({ limit: resultsLimit, offset: historyOffset }),
    refetchInterval: REFETCH_INTERVAL,
  });
  const latestData = latestQuery.data?.checks ?? [];
  const wsLatest = wsResults;

  const allModelsWithStatus: ModelWithStatus[] = useMemo(() => {
    const checkMap = mergeLatestHealthChecks(latestData, wsLatest);

    return allModelNames.map((model) => {
      const check = checkMap.get(model.modelName);
      if (!check) {
        return {
          id: null,
          modelName: model.modelName,
          status: "unknown" as const,
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
      }
      return {
        id: check.id,
        modelName: check.modelName,
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
      };
    });
  }, [allModelNames, latestData, wsLatest]);

  return {
    modelsQuery,
    latestQuery,
    summaryQuery,
    resultsQuery,
    wsStatus,
    wsResults,
    allModelsWithStatus,
    resultsLimit,
    resultsPage,
    setResultsPage,
    isLatestPage,
    historyOffset,
  };
}
