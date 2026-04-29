import {
  acknowledgeAlert,
  countAlertsSince,
  getActiveAlerts,
  getAlerts,
} from "@lite-llm/monitor";
import { Router } from "express";

export function createMonitorRouter(): Router {
  const router = Router();

  // GET /api/monitor/alerts — List alerts with pagination/filters
  router.get("/alerts", (req, res) => {
    try {
      const {
        limit,
        offset,
        anomaly_type,
        model,
        severity,
        since,
        acknowledged,
      } = req.query;
      const result = getAlerts({
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        anomalyType: anomaly_type as string | undefined,
        model: model as string | undefined,
        severity: severity as string | undefined,
        acknowledged:
          acknowledged !== undefined ? acknowledged === "true" : undefined,
      });

      // If since filter, filter in-memory (simple approach for v1)
      let alerts = result.alerts;
      if (since) {
        const sinceTs = Math.floor(new Date(since as string).getTime() / 1000);
        alerts = alerts.filter((a) => a.detectedAt >= sinceTs);
      }

      res.json({
        alerts,
        total: alerts.length,
        limit: Number(limit || 50),
        offset: Number(offset || 0),
      });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // GET /api/monitor/alerts/active — Active (unacknowledged) alerts
  router.get("/alerts/active", (_req, res) => {
    try {
      const alerts = getActiveAlerts();
      res.json({ alerts });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch active alerts" });
    }
  });

  // POST /api/monitor/alerts/:id/acknowledge — Acknowledge an alert
  router.post("/alerts/:id/acknowledge", (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid alert ID" });
        return;
      }
      const alert = acknowledgeAlert(id);
      if (!alert) {
        res.status(404).json({ error: "Alert not found" });
        return;
      }
      res.json({ success: true, alert });
    } catch (_err) {
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  // GET /api/monitor/stats — Alert statistics
  router.get("/stats", (_req, res) => {
    try {
      const allAlerts = getAlerts({ limit: 10000 });
      const activeAlerts = getActiveAlerts();
      const last24h = countAlertsSince(Math.floor(Date.now() / 1000) - 86400);

      const alertsByType: Record<string, number> = {};
      const alertsBySeverity: Record<string, number> = {};

      for (const alert of allAlerts.alerts) {
        alertsByType[alert.anomalyType] =
          (alertsByType[alert.anomalyType] || 0) + 1;
        alertsBySeverity[alert.severity] =
          (alertsBySeverity[alert.severity] || 0) + 1;
      }

      res.json({
        total_alerts: allAlerts.total,
        active_alerts: activeAlerts.length,
        alerts_by_type: alertsByType,
        alerts_by_severity: alertsBySeverity,
        last_24h_count: last24h,
      });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // GET /api/monitor/models/health — Current model health
  router.get("/models/health", (_req, res) => {
    try {
      // For v1, derive from active alerts
      const activeAlerts = getActiveAlerts();
      const modelStatuses: Record<
        string,
        { status: string; last_error_at: string | null; error_rate_1h: number }
      > = {};

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

      const models = Object.entries(modelStatuses).map(([model, data]) => ({
        model,
        ...data,
      }));
      res.json({ models });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch model health" });
    }
  });

  return router;
}
