import type { SystemAgent } from "@lite-llm/agents-manager";
import type { AgentCatalogEntry } from "@lite-llm/api-contracts/agent-routing";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

export function registerAgentCatalogRoutes(
  app: Application,
  opts?: RouteOptions,
): void {
  app.get("/agent-catalog", async (_req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const agents = await services.catalog.getAll();
      const agentsWithKeys = Object.entries(agents).map(
        ([key, agent]) => ({ key, ...agent }) as AgentCatalogEntry,
      );
      res.json({ agents: agentsWithKeys });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/agent-catalog/:id", async (req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const agent = await services.catalog.get(req.params.id);

      if (agent === undefined) {
        res
          .status(404)
          .json({ error: `SystemAgent "${req.params.id}" not found` });
        return;
      }

      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/agent-catalog", async (req, res) => {
    try {
      const { key, ...entry } = req.body as { key: string } & SystemAgent;

      if (!key || typeof key !== "string") {
        res.status(400).json({ error: "Missing required field: key" });
        return;
      }

      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      await services.catalog.create(key, entry as SystemAgent);

      if (opts?.orchestration) {
        await opts.orchestration.syncGeneratedArtifacts();
      }

      res.status(201).json({ key });
    } catch (error) {
      const message = String(error);
      if (message.includes("already exists")) {
        res.status(409).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  app.put("/agent-catalog/:id", async (req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const existing = await services.catalog.get(req.params.id);

      if (existing === undefined) {
        res
          .status(404)
          .json({ error: `SystemAgent "${req.params.id}" not found` });
        return;
      }

      const entry = req.body as Partial<SystemAgent>;
      await services.catalog.update(req.params.id, entry);

      if (opts?.orchestration) {
        await opts.orchestration.syncGeneratedArtifacts();
      }

      const updated = await services.catalog.get(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/agent-catalog/:id", async (req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const existing = await services.catalog.get(req.params.id);

      if (existing === undefined) {
        res
          .status(404)
          .json({ error: `SystemAgent "${req.params.id}" not found` });
        return;
      }

      await services.catalog.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
