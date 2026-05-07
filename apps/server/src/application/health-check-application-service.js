import {
  getHealthCheckSummary,
  getHealthChecks,
  getLatestHealthChecks,
} from "@lite-llm/monitor";

const defaultStoreApi = {
  getHealthChecks,
  getLatestHealthChecks,
  getHealthCheckSummary,
};
export function createHealthCheckApplicationService(
  storeApi = defaultStoreApi,
) {
  return {
    listResults(input) {
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
