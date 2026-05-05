import {
  getHealthCheckSummary,
  getHealthChecks,
  getLatestHealthChecks,
} from "@lite-llm/monitor";

interface GetResultsInput {
  model?: string;
  limit: number;
  offset: number;
  since?: string;
}

interface HealthCheckStoreApi {
  getHealthChecks: typeof getHealthChecks;
  getLatestHealthChecks: typeof getLatestHealthChecks;
  getHealthCheckSummary: typeof getHealthCheckSummary;
}

const defaultStoreApi: HealthCheckStoreApi = {
  getHealthChecks,
  getLatestHealthChecks,
  getHealthCheckSummary,
};

export function createHealthCheckApplicationService(
  storeApi: HealthCheckStoreApi = defaultStoreApi,
) {
  return {
    listResults(input: GetResultsInput) {
      const since = input.since
        ? Math.floor(new Date(input.since).getTime() / 1000)
        : undefined;

      const result = storeApi.getHealthChecks({
        model: input.model,
        limit: input.limit,
        offset: input.offset,
        since,
      });

      return {
        checks: result.checks,
        total: result.total,
        limit: input.limit,
        offset: input.offset,
      };
    },

    listLatest() {
      return storeApi.getLatestHealthChecks();
    },

    getSummary() {
      return storeApi.getHealthCheckSummary();
    },
  };
}

export type HealthCheckApplicationService = ReturnType<
  typeof createHealthCheckApplicationService
>;
