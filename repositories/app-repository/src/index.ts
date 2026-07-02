export type { AppDb } from "./client";
export { getAppDb } from "./client";
export type {
  GetAlertsOptions,
  GetAlertsResult,
  GetHealthChecksOptions,
  GetHealthChecksResult,
  HealthCheckSummaryResult,
} from "./queries";
export {
  acknowledgeAlert,
  cleanupOldHealthChecks,
  countAlertsSince,
  getActiveAlerts,
  getAlerts,
  getHealthCheckSummary,
  getHealthChecks,
  getLatestHealthChecks,
  insertAlert,
  insertHealthCheck,
} from "./queries";
export type {
  Alert,
  ModelHealthCheck,
  NewAlert,
  NewModelHealthCheck,
} from "./schema";
export {
  alerts,
  modelHealthChecks,
} from "./schema";
