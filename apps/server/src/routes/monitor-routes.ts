import { Router } from "express";
import type { MonitorApplicationService } from "../application/monitor-application-service.js";

export function createMonitorRouter(
  service: MonitorApplicationService,
): Router {
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
      const result = service.listAlerts({
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        anomalyType: anomaly_type as string | undefined,
        model: model as string | undefined,
        severity: severity as string | undefined,
        acknowledged:
          acknowledged !== undefined ? acknowledged === "true" : undefined,
        since: since as string | undefined,
      });
      res.json(result);
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // GET /api/monitor/alerts/active — Active (unacknowledged) alerts
  router.get("/alerts/active", (_req, res) => {
    try {
      const alerts = service.listActiveAlerts();
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
      const alert = service.acknowledgeAlertById(id);
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
      res.json(service.getStats());
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // GET /api/monitor/models/health — Current model health
  router.get("/models/health", (_req, res) => {
    try {
      const models = service.getModelHealth();
      res.json({ models });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch model health" });
    }
  });

  return router;
}
