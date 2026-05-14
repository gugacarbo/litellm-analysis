import type { CategoryEntry } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

export function registerCategoryCatalogRoutes(
  app: Application,
  opts?: RouteOptions,
): void {
  app.get("/category-catalog", async (_req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const categories = await services.categories.getAll();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/category-catalog/:key", async (req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const category = await services.categories.get(req.params.key);

      if (category === undefined) {
        res
          .status(404)
          .json({ error: `Category "${req.params.key}" not found` });
        return;
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/category-catalog", async (req, res) => {
    try {
      const { key, ...entry } = req.body as { key: string } & CategoryEntry;

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
      await services.categories.create(key, entry as CategoryEntry);

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

  app.put("/category-catalog/:key", async (req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const existing = await services.categories.get(req.params.key);

      if (existing === undefined) {
        res
          .status(404)
          .json({ error: `Category "${req.params.key}" not found` });
        return;
      }

      const entry = req.body as Partial<CategoryEntry>;
      await services.categories.update(req.params.key, entry);

      const updated = await services.categories.get(req.params.key);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/category-catalog/:key", async (req, res) => {
    try {
      const manager = opts?.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const existing = await services.categories.get(req.params.key);

      if (existing === undefined) {
        res
          .status(404)
          .json({ error: `Category "${req.params.key}" not found` });
        return;
      }

      await services.categories.delete(req.params.key);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
