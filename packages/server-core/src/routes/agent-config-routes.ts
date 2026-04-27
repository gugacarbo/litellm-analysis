import type { AgentConfig, CategoryConfig } from "@litellm/shared";
import type { Application } from "express";
import {
  buildAliasMapFromDb,
  buildLiteLLMParams,
  regenerateAllAliases,
  syncGeneratedArtifacts,
} from "../orchestration/index.js";
import type { RouteOptions } from "../types/index.js";

export function registerAgentConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource, orchestration } = opts;

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

  app.get("/agent-config", async (_req, res) => {
    try {
      const { readConfigFile } = await import("@lite-llm/agents-manager");
      const config = await readConfigFile();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/agent-config/:key", async (req, res) => {
    try {
      const key = req.params.key;
      if (key === "global-fallback") {
        res.status(404).json({
          error: "Use /agent-config/global-fallback for global fallback",
        });
        return;
      }
      const { readConfigFile } = await import("@lite-llm/agents-manager");
      const config = await readConfigFile();
      const isAgent = key in (config.agents || {});
      const isCategory = key in (config.categories || {});

      if (isAgent) {
        res.json({ type: "agent", key, config: config.agents?.[key] });
      } else if (isCategory) {
        res.json({
          type: "category",
          key,
          config: config.categories?.[key],
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

      const { resolveConfiguredModels } = await import(
        "@lite-llm/alias-router"
      );
      const { actualModel, actualFallbacks } = resolveConfiguredModels(
        key,
        String(rawConfig.model || ""),
        (rawConfig.fallback_models as string[] | undefined) || [],
        existingAliases,
      );

      const configToSave = {
        ...rawConfig,
        model: actualModel,
        fallback_models: actualFallbacks,
      };

      const { updateAgentInConfig, updateCategoryInConfig } = await import(
        "@lite-llm/agents-manager"
      );

      if (type === "agent") {
        await updateAgentInConfig(key, configToSave);
      } else {
        await updateCategoryInConfig(key, configToSave);
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

      const { deleteAgentFromConfig, deleteCategoryFromConfig } = await import(
        "@lite-llm/agents-manager"
      );

      if (type === "category") {
        await deleteCategoryFromConfig(key);
      } else {
        await deleteAgentFromConfig(key);
      }
      await orchestration.syncGeneratedArtifacts();

      const { getExistingAliasesForAgent } = await import(
        "@lite-llm/alias-router"
      );
      const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
      const existingRouting = await getAgentRoutingConfig();
      const existingAliases = existingRouting?.model_group_alias
        ? (existingRouting.model_group_alias as Record<string, string>)
        : {};
      const keysToRemove = getExistingAliasesForAgent(key, existingAliases);
      const deletions: Record<string, string> = {};
      for (const aliasKey of keysToRemove) {
        deletions[aliasKey] = "";
      }
      await updateAgentRoutingConfig(deletions);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-config", async (req, res) => {
    try {
      const { agents: rawAgents, categories: rawCategories } = req.body;

      const agentsToSave: Record<string, AgentConfig> = {};
      const categoriesToSave: Record<string, CategoryConfig> = {};

      const { resolveConfiguredModels } = await import(
        "@lite-llm/alias-router"
      );
      const existingAliases = await buildAliasMapFromDb();

      if (rawAgents && typeof rawAgents === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawAgents as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ""),
            (rawCfg.fallback_models as string[] | undefined) || [],
            existingAliases,
          );

          agentsToSave[key] = {
            ...rawCfg,
            model: actualModel,
            fallback_models: actualFallbacks,
          } as AgentConfig;
        }
      }

      if (rawCategories && typeof rawCategories === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawCategories as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ""),
            (rawCfg.fallback_models as string[] | undefined) || [],
            existingAliases,
          );

          categoriesToSave[key] = {
            ...rawCfg,
            model: actualModel,
            fallback_models: actualFallbacks,
          } as CategoryConfig;
        }
      }

      const { writeFullConfig } = await import("@lite-llm/agents-manager");
      await writeFullConfig({
        agents: agentsToSave,
        categories: categoriesToSave,
      });

      await orchestration.syncGeneratedArtifacts();
      await orchestration.regenerateAllAliases();

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

      const { deleteAgentFromConfig, deleteCategoryFromConfig } = await import(
        "@lite-llm/agents-manager"
      );

      if (type === "category") {
        await deleteCategoryFromConfig(key);
      } else {
        await deleteAgentFromConfig(key);
      }
      await orchestration.syncGeneratedArtifacts();

      const { getExistingAliasesForAgent } = await import(
        "@lite-llm/alias-router"
      );
      const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
      const existingRouting = await getAgentRoutingConfig();
      const existingAliases = existingRouting?.model_group_alias
        ? (existingRouting.model_group_alias as Record<string, string>)
        : {};
      const keysToRemove = getExistingAliasesForAgent(key, existingAliases);
      const deletions: Record<string, string> = {};
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
