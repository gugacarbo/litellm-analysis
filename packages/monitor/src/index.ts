export type { MonitorDb } from "./db/monitor-client";
export { getMonitorDb } from "./db/monitor-client";
export type {
  GetAlertsOptions,
  GetAlertsResult,
} from "./db/monitor-queries";
export {
  acknowledgeAlert,
  countAlertsSince,
  getActiveAlerts,
  getAlerts,
  insertAlert,
} from "./db/monitor-queries";
export {
  alerts,
  alertRules,
} from "./db/monitor-schema";
export type {
  Alert,
  AlertRule,
  NewAlert,
  NewAlertRule,
} from "./db/monitor-schema";
export type {
  MonitorServiceEvents,
} from "./services/monitor-service";
export { MonitorService } from "./services/monitor-service";
export type {
  AnomalyAlert,
  AnomalyType,
  AlertSeverity,
  DetectorInput,
  DetectorResult,
  ModelHealthStatus,
  ModelHealthUpdate,
  MonitorServiceOptions,
} from "./services/monitor-types";

export { runAllDetectors } from "./services/detectors";
