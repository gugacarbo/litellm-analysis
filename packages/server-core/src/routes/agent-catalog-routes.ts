import type { SystemAgent } from "@lite-llm/agents-manager";
import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";

// Extract the key from the body for POST, from params for PUT/DELETE

export function registerAgentCatalogRoutes(
  app: Application,
  opts?: RouteOptions,
): void {
  // GET /agent-catalog — returns all SystemAgents as an array
  app.get("/agent-catalog", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const agents = await services.catalog.getAll();
      res.json({ agents: Object.values(agents) });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /agent-catalog/:id — returns a single SystemAgent by key
  app.get("/agent-catalog/:id", async (req, res) => {
    try {
      const { services } = createAgentsManager();
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

  // POST /agent-catalog — creates a new SystemAgent
  app.post("/agent-catalog", async (req, res) => {
    try {
      const { key, ...entry } = req.body as { key: string } & SystemAgent;

      if (!key || typeof key !== "string") {
        res.status(400).json({ error: "Missing required field: key" });
        return;
      }

      const { services } = createAgentsManager();
      await services.catalog.create(key, entry as SystemAgent);

      // Optionally sync generated artifacts if orchestration is available
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

  // PUT /agent-catalog/:id — updates an existing SystemAgent (partial merge)
  app.put("/agent-catalog/:id", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      const existing = await services.catalog.get(req.params.id);

      if (existing === undefined) {
        res
          .status(404)
          .json({ error: `SystemAgent "${req.params.id}" not found` });
        return;
      }

      const entry = req.body as Partial<SystemAgent>;
      await services.catalog.update(req.params.id, entry);

      // Optionally sync generated artifacts if orchestration is available
      if (opts?.orchestration) {
        await opts.orchestration.syncGeneratedArtifacts();
      }

      const updated = await services.catalog.get(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // DELETE /agent-catalog/:id — deletes a SystemAgent
  app.delete("/agent-catalog/:id", async (req, res) => {
    try {
      const { services } = createAgentsManager();
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
