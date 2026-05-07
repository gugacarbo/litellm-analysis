export type { AppDb } from "./client.js";
export { getAppDb } from "./client.js";
export type {
  GetAlertsOptions,
  GetAlertsResult,
  GetHealthChecksOptions,
  GetHealthChecksResult,
  HealthCheckSummaryResult,
} from "./queries.js";
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
} from "./queries.js";
export type {
  Alert,
  AlertRule,
  ModelHealthCheck,
  NewAlert,
  NewAlertRule,
  NewModelHealthCheck,
} from "./schema.js";
export {
  alertRules,
  alerts,
  modelHealthChecks,
} from "./schema.js";
