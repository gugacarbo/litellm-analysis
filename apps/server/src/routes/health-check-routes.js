import { Router } from "express";
export function createHealthCheckRouter(service) {
  const router = Router();
  router.get("/results", (req, res) => {
    try {
      const { model, limit, offset, since } = req.query;
      const result = service.listResults({
        model: model,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        since: since,
      });
      res.json(result);
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch health check results" });
    }
  });
  router.get("/latest", (_req, res) => {
    try {
      const checks = service.listLatest();
      res.json({ checks });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch latest health checks" });
    }
  });
  router.get("/summary", (_req, res) => {
    try {
      const summary = service.getSummary();
      res.json(summary);
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch health check summary" });
    }
  });
  return router;
}
