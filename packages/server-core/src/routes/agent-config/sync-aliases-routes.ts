import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../../types/index.js";

export function registerSyncAliasesRoutes(
  app: Application,
  _opts: RouteOptions,
): void {
  app.get("/agent-config/sync-aliases", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const enabled = await services.routing.getSyncAliases();
      res.json({ enabled });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-config/sync-aliases", async (req, res) => {
    try {
      const { enabled } = req.body as { enabled?: boolean };
      const { services } = createAgentsManager();
      await services.routing.setSyncAliases(enabled === true);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
