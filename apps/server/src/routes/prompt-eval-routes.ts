import { Router } from "express";
import type { PromptEvalAppServiceOptions } from "../application/prompt-eval-application-service.js";

type PromptEvalService = ReturnType<
  typeof import("../application/prompt-eval-application-service.js").createPromptEvalApplicationService
>;

export function createPromptEvalRouter(service: PromptEvalService): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { model, threshold = 0.8, cases } = req.body;
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      if (!cases || !Array.isArray(cases) || cases.length === 0) {
        res.status(400).json({ error: "cases must be a non-empty array" });
        return;
      }
      const result = await service.startRun(model, threshold, cases);
      res.status(201).json(result);
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  router.get("/", (_req, res) => {
    try {
      const page = parseInt(_req.query.page as string) || 1;
      const pageSize = parseInt(_req.query.pageSize as string) || 20;
      const result = service.listRuns(page, pageSize);
      res.json(result);
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  router.get("/:id", (req, res) => {
    try {
      const run = service.getRunDetails(req.params.id);
      if (!run) {
        res.status(404).json({ error: "Run not found" });
        return;
      }
      res.json(run);
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  router.get("/:id/artifacts", (req, res) => {
    try {
      const artifacts = service.getRunArtifacts(req.params.id);
      res.json(artifacts);
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  router.post("/:id/cancel", (req, res) => {
    try {
      const cancelled = service.cancelRun(req.params.id);
      if (!cancelled) {
        res.status(409).json({ error: "Run is not active" });
        return;
      }
      res.json({ cancelled: true });
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  return router;
}
