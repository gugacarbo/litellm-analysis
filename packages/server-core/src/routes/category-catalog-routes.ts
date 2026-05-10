import type { CategoryEntry } from "@lite-llm/agents-manager";
import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";

export function registerCategoryCatalogRoutes(
  app: Application,
  _opts?: RouteOptions,
): void {
  // GET /category-catalog — returns all categories
  app.get("/category-catalog", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const categories = await services.categories.getAll();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /category-catalog/:key — returns a single category
  app.get("/category-catalog/:key", async (req, res) => {
    try {
      const { services } = createAgentsManager();
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

  // POST /category-catalog — creates a new category (key from body)
  app.post("/category-catalog", async (req, res) => {
    try {
      const { key, ...entry } = req.body as { key: string } & CategoryEntry;

      if (!key || typeof key !== "string") {
        res.status(400).json({ error: "Missing required field: key" });
        return;
      }

      const { services } = createAgentsManager();
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

  // PUT /category-catalog/:key — updates a category (partial merge)
  app.put("/category-catalog/:key", async (req, res) => {
    try {
      const { services } = createAgentsManager();
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

  // DELETE /category-catalog/:key — deletes a category
  app.delete("/category-catalog/:key", async (req, res) => {
    try {
      const { services } = createAgentsManager();
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
