import { Router } from "express";
import type { HealthCheckApplicationService } from "../application/health-check-application-service";

export function createHealthCheckRouter(
  service: HealthCheckApplicationService,
): Router {
  const router = Router();

  router.get("/results", (req, res) => {
    try {
      const { model, limit, offset, since } = req.query;
      const result = service.listResults({
        model: model as string | undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        since: since as string | undefined,
      });
      res.json(result);
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch health check results" });
    }
  });

  router.get("/latest", async (_req, res) => {
    try {
      const checks = await service.listLatest();
      res.json({ checks });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch latest health checks" });
    }
  });

  router.get("/summary", async (_req, res) => {
    try {
      const summary = await service.getSummary();
      res.json(summary);
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch health check summary" });
    }
  });

  return router;
}
