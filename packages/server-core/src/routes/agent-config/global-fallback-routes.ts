import type { Application } from "express";
import {
  buildAliasMapFromDb,
  regenerateAllAliases,
} from "../../orchestration/index.js";
import type { RouteOptions } from "../../types/index.js";

export function registerGlobalFallbackRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { orchestration } = opts;

  app.get("/agent-config/global-fallback", async (_req, res) => {
    try {
      const { readDb } = await import("@lite-llm/agents-manager");
      const db = await readDb();
      res.json({
        globalFallbackModel: db.globalFallbackModel || "gpt-5.1",
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-config/global-fallback", async (req, res) => {
    try {
      const { globalFallbackModel } = req.body as {
        globalFallbackModel?: string;
      };
      const { updateGlobalFallbackInDb } = await import(
        "@lite-llm/agents-manager"
      );
      const newGlobalFallback = globalFallbackModel || "gpt-5.1";
      await updateGlobalFallbackInDb(newGlobalFallback);
      await orchestration.syncGeneratedArtifacts();
      await orchestration.regenerateAllAliases();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
