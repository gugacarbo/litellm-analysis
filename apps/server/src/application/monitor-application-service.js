import {
  acknowledgeAlert,
  countAlertsSince,
  getActiveAlerts,
  getAlerts,
} from "@lite-llm/monitor";

const defaultStoreApi = {
  acknowledgeAlert,
  countAlertsSince,
  getActiveAlerts,
  getAlerts,
};
function toModelStatuses(activeAlerts) {
  const modelStatuses = {};
  for (const alert of activeAlerts) {
    if (!alert.model) continue;
    if (!modelStatuses[alert.model]) {
      modelStatuses[alert.model] = {
        status: "unknown",
        last_error_at: null,
        error_rate_1h: 0,
      };
    }
    if (alert.severity === "critical") {
      modelStatuses[alert.model].status = "offline";
    } else if (
      alert.severity === "warning" &&
      modelStatuses[alert.model].status !== "offline"
    ) {
      modelStatuses[alert.model].status = "degraded";
    }
    if (
      !modelStatuses[alert.model].last_error_at ||
      alert.detectedAt * 1000 >
        new Date(modelStatuses[alert.model].last_error_at || "0").getTime()
    ) {
      modelStatuses[alert.model].last_error_at = new Date(
        alert.detectedAt * 1000,
      ).toISOString();
    }
  }
  return modelStatuses;
}
export function createMonitorApplicationService(storeApi = defaultStoreApi) {
  return {
    listAlerts(input) {
      const result = storeApi.getAlerts({
        limit: input.limit,
        offset: input.offset,
        anomalyType: input.anomalyType,
        model: input.model,
        severity: input.severity,
        acknowledged: input.acknowledged,
      });
      let alerts = result.alerts;
      if (input.since) {
        const sinceTs = Math.floor(new Date(input.since).getTime() / 1000);
        alerts = alerts.filter((alert) => alert.detectedAt >= sinceTs);
      }
      return {
        alerts,
        total: alerts.length,
        limit: input.limit,
        offset: input.offset,
      };
    },
    listActiveAlerts() {
      return storeApi.getActiveAlerts();
    },
    acknowledgeAlertById(id) {
      return storeApi.acknowledgeAlert(id);
    },
    getStats() {
      const allAlerts = storeApi.getAlerts({ limit: 10_000 });
      const activeAlerts = storeApi.getActiveAlerts();
      const last24h = storeApi.countAlertsSince(
        Math.floor(Date.now() / 1000) - 86_400,
      );
      const alertsByType = {};
      const alertsBySeverity = {};
      for (const alert of allAlerts.alerts) {
        alertsByType[alert.anomalyType] =
          (alertsByType[alert.anomalyType] || 0) + 1;
        alertsBySeverity[alert.severity] =
          (alertsBySeverity[alert.severity] || 0) + 1;
      }
      return {
        total_alerts: allAlerts.total,
        active_alerts: activeAlerts.length,
        alerts_by_type: alertsByType,
        alerts_by_severity: alertsBySeverity,
        last_24h_count: last24h,
      };
    },
    getModelHealth() {
      const activeAlerts = storeApi.getActiveAlerts();
      const modelStatuses = toModelStatuses(activeAlerts);
      return Object.entries(modelStatuses).map(([model, data]) => ({
        model,
        ...data,
      }));
    },
  };
}
