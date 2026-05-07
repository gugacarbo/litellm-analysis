import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../../types/index.js";

export function registerGlobalFallbackRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { orchestration } = opts;

  app.get("/agent-config/global-fallback", async (_req, res) => {
    try {
      const { repository } = createAgentsManager();
      const config = await repository.read();
      res.json({
        globalFallbackModel: config.globalFallbackModel || "gpt-5.1",
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
      const { repository } = createAgentsManager();
      const config = await repository.read();
      config.globalFallbackModel = globalFallbackModel || "gpt-5.1";
      await repository.write(config);

      await orchestration.syncGeneratedArtifacts();
      await orchestration.regenerateAllAliases();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
