import { createAgentsManager } from "@lite-llm/agents-manager";
import {
  getExistingAliasesForAgent,
  resolveConfiguredModels,
} from "@lite-llm/alias-router";
import {
  buildAliasMapFromDb,
  regenerateAllAliases,
} from "../../orchestration/index.js";
export function registerItemRoutes(app, opts) {
  const { dataSource, orchestration } = opts;
  app.get("/agent-config/:key", async (req, res) => {
    try {
      const key = req.params.key;
      if (key === "global-fallback") {
        res.status(404).json({
          error: "Use /agent-config/global-fallback for global fallback",
        });
        return;
      }
      const { services } = createAgentsManager();
      const agents = await services.agents.getAll();
      const categories = await services.categories.getAll();
      const isAgent = key in (agents || {});
      const isCategory = key in (categories || {});
      if (isAgent) {
        res.json({ type: "agent", key, config: agents[key] });
      } else if (isCategory) {
        res.json({
          type: "category",
          key,
          config: categories[key],
        });
      } else {
        res.status(404).json({
          error: `No agent or category found with key "${key}"`,
        });
      }
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app.put("/agent-config/:key", async (req, res) => {
    try {
      const key = req.params.key;
      if (key === "global-fallback") {
        res.status(404).json({
          error: "Use PUT /agent-config/global-fallback for global fallback",
        });
        return;
      }
      const { type, config: rawConfig, syncAliases } = req.body;
      if (!type || !["agent", "category"].includes(type)) {
        res.status(400).json({ error: 'type must be "agent" or "category"' });
        return;
      }
      if (
        !rawConfig ||
        typeof rawConfig !== "object" ||
        Array.isArray(rawConfig)
      ) {
        res.status(400).json({ error: "config object is required" });
        return;
      }
      const existingAliases = await buildAliasMapFromDb();
      const { services } = createAgentsManager();
      const { actualModel, actualFallbacks } = resolveConfiguredModels(
        key,
        String(rawConfig.model || ""),
        rawConfig.fallback_models || [],
        existingAliases,
      );
      const configToSave = {
        ...rawConfig,
        model: actualModel,
        fallback_models: actualFallbacks,
      };
      if (type === "agent") {
        await services.agents.upsert(key, configToSave);
      } else {
        await services.categories.upsert(key, configToSave);
      }
      await orchestration.syncGeneratedArtifacts();
      if (syncAliases) {
        await regenerateAllAliases(dataSource);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app.delete("/agent-config/:key", async (req, res) => {
    try {
      const key = req.params.key;
      if (key === "global-fallback") {
        res.status(404).json({ error: "Global fallback cannot be deleted" });
        return;
      }
      const { type } = req.query;
      const { services } = createAgentsManager();
      if (type === "category") {
        await services.categories.delete(key);
      } else {
        await services.agents.delete(key);
      }
      await orchestration.syncGeneratedArtifacts();
      const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
      const existingRouting = await getAgentRoutingConfig();
      const existingAliases = existingRouting?.model_group_alias
        ? existingRouting.model_group_alias
        : {};
      const keysToRemove = getExistingAliasesForAgent(key, existingAliases);
      const deletions = {};
      for (const aliasKey of keysToRemove) {
        deletions[aliasKey] = "";
      }
      await updateAgentRoutingConfig(deletions);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
