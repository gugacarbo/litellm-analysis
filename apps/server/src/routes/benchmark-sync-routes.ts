import { Router } from "express";
import {
  type BenchmarkSyncApplicationService,
  BenchmarkSyncConfigurationError,
} from "../application/benchmark-sync-application-service";

export function createBenchmarkSyncRouter(
  service: BenchmarkSyncApplicationService,
): Router {
  const router = Router();

  router.get("/sync-status", (_req, res) => {
    res.json(service.getStatus());
  });

  router.post("/sync", async (_req, res) => {
    try {
      const result = await service.start();
      res.status(result.triggered ? 202 : 200).json(result);
    } catch (error) {
      if (error instanceof BenchmarkSyncConfigurationError) {
        res.status(503).json({
          error: error.message,
          code: "ARTIFICIAL_ANALYSIS_API_KEY_MISSING",
        });
        return;
      }

      res.status(500).json({ error: "Failed to trigger benchmark sync" });
    }
  });

  return router;
}
