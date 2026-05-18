import type {
  HealthCheckResult,
  HealthCheckSummary,
} from "@/lib/api-client/health-check";

export type { ConnectionState } from "@/types/connection";

export type HealthCheckStatus = "healthy" | "unhealthy" | "error" | "unknown";

export type HealthCheckResultEntry = Omit<HealthCheckResult, "status"> & {
  status: HealthCheckStatus;
};

export type HealthCheckSummaryData = HealthCheckSummary;

export interface HealthCheckUpdatePayload {
  results: HealthCheckResultEntry[];
  timestamp: number;
}
export type { ConnectionState } from "@/shared/types/connection";
