import { Router } from "express";
import {
  OpenRouterBenchmarkSyncConfigurationError,
  type OpenRouterBenchmarkSyncApplicationService,
} from "../application/openrouter-benchmark-sync-application-service";

export function createOpenRouterBenchmarkSyncRouter(
  service: OpenRouterBenchmarkSyncApplicationService,
): Router {
  const router = Router();

  router.get("/sync-status", (_req, res) => {
    res.json(service.getStatus());
  });

  router.post("/sync", (_req, res) => {
    try {
      const result = service.start();
      res.status(result.triggered ? 202 : 200).json(result);
    } catch (error) {
      if (error instanceof OpenRouterBenchmarkSyncConfigurationError) {
        res.status(503).json({
          error: error.message,
          code: "OPENROUTER_API_KEY_MISSING",
        });
        return;
      }

      res.status(500).json({ error: "Failed to trigger OpenRouter benchmark sync" });
    }
  });

  return router;
}