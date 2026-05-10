import type { SystemAgent } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../../types/index.js";

export function registerConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  app.get("/agent-catalog", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const agents = await services.catalog.getAll();
      res.json({ agents: Object.values(agents) });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/agent-catalog/:id", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const agent = await services.catalog.get(req.params.id);
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }
      res.json({ agent });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-catalog/:id", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services, registry } = manager;
      const body = req.body as Partial<SystemAgent>;
      if (!body.displayName) {
        res.status(400).json({ error: "displayName is required" });
        return;
      }
      await services.catalog.upsert(req.params.id, body as SystemAgent);
      await registry.exportAll();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/agent-catalog/:id", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services, registry } = manager;
      await services.catalog.delete(req.params.id);
      await registry.exportAll();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
