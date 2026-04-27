import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
import type { AgentConfig, CategoryConfig } from "@litellm/shared";
import express, { type Application } from "express";

function parseDays(rawValue: unknown, fallback: number): number {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export function createApiServer(dataSource: AnalyticsDataSource): Application {
  const app = express();
  app.use(express.json());

  app.get("/mode", (_req, res) => {
    const { capabilities } = dataSource;
    let mode: string;
    if (capabilities.errorLogs && capabilities.createModel) {
      mode = "database";
    } else if (capabilities.errorLogs && !capabilities.createModel) {
      mode = "limited";
    } else {
      mode = "api-only";
    }
    res.json({
      mode,
      capabilities,
    });
  });

  app.get("/spend/model", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByModel(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/logs/count", async (req, res) => {
    try {
      const { model, user, startDate, endDate } = req.query;
      const count = await dataSource.getSpendLogsCount({
        model: model as string,
        user: user as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/logs", async (req, res) => {
    try {
      const { model, user, startDate, endDate, limit, offset } = req.query;
      const data = await dataSource.getSpendLogs({
        model: model as string,
        user: user as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/user", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByUser(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/key", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByKey(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/errors", async (req, res) => {
    if (!dataSource.capabilities.errorLogs) {
      res.status(501).json({
        error: "Error logs are not available in API-only mode",
      });
      return;
    }

    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getErrorLogs(limit, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/metrics", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getMetricsSummary(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/trend", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailySpendTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/tokens", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getTokenDistribution(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/performance", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getPerformanceMetrics(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/temporal", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 7);
      const data = await dataSource.getHourlyUsagePatterns(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/keys", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getApiKeyStats(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/cost-efficiency", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getCostEfficiency(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-distribution", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getModelDistribution(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/token-trend", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailyTokenTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-stats", async (_req, res) => {
    try {
      const data = await dataSource.getModelStatistics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models", async (_req, res) => {
    try {
      const data = await dataSource.getModels();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/model/details", async (_req, res) => {
    try {
      const data = await dataSource.getModelDetails();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models", async (req, res) => {
    if (!dataSource.capabilities.createModel) {
      res.status(403).json({ error: "Operation not allowed in limited mode" });
      return;
    }
    try {
      const { modelName, litellmParams } = req.body;
      await dataSource.createModel({
        modelName,
        litellmParams: litellmParams ?? {},
      });
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/models/:name", async (req, res) => {
    if (!dataSource.capabilities.updateModel) {
      res.status(403).json({ error: "Operation not allowed in limited mode" });
      return;
    }
    try {
      const { name } = req.params;
      const { litellmParams, modelName } = req.body;
      const updates: {
        litellmParams?: Record<string, unknown>;
        modelName?: string;
      } = {};
      if (litellmParams !== undefined) updates.litellmParams = litellmParams;
      if (modelName !== undefined) updates.modelName = modelName;
      await dataSource.updateModel(name, updates);
      res.json({ success: true });
    } catch (error) {
      const msg = String(error);
      if (msg.includes("not found") || msg.includes("No row")) {
        res.status(404).json({ error: "Model not found" });
        return;
      }
      res.status(500).json({ error: msg });
    }
  });

  app.post("/models/merge", async (req, res) => {
    if (!dataSource.capabilities.mergeModels) {
      res.status(403).json({ error: "Operation not allowed in limited mode" });
      return;
    }
    const { sourceModel, targetModel } = req.body;
    if (!sourceModel || !targetModel) {
      res
        .status(400)
        .json({ error: "sourceModel and targetModel are required" });
      return;
    }
    try {
      await dataSource.mergeModels(sourceModel, targetModel);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  const handleDeleteModelLogs = async (
    model: string,
    res: express.Response,
  ) => {
    if (!dataSource.capabilities.deleteModelLogs) {
      res.status(403).json({ error: "Operation not allowed in limited mode" });
      return;
    }
    try {
      await dataSource.deleteModelLogs(model);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  app.delete("/models/logs", async (req, res) => {
    const { model } = req.query;
    if (Array.isArray(model)) {
      res.status(400).json({ error: "model must be a single query value" });
      return;
    }
    if (typeof model !== "string") {
      res.status(400).json({ error: "model query parameter is required" });
      return;
    }
    await handleDeleteModelLogs(model, res);
  });

  app.delete("/models/logs/:model", async (req, res) => {
    await handleDeleteModelLogs(req.params.model, res);
  });

  app.delete("/models/:name", async (req, res) => {
    if (!dataSource.capabilities.deleteModel) {
      res.status(403).json({ error: "Operation not allowed in limited mode" });
      return;
    }
    try {
      const { name } = req.params;
      await dataSource.deleteModel(name);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/agent-routing", async (_req, res) => {
    if (!dataSource.capabilities.agentRouting) {
      res
        .status(501)
        .json({ error: "Agent routing is not available in the current mode" });
      return;
    }
    try {
      const data = await dataSource.getAgentRoutingConfig();
      res.json(data ?? {});
    } catch (error) {
      const errorMsg = String(error).toLowerCase();
      if (
        errorMsg.includes("does not exist") ||
        errorMsg.includes("relation")
      ) {
        res.json({});
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-routing", async (req, res) => {
    if (!dataSource.capabilities.agentRouting) {
      res.status(501).json({
        error: "Agent routing updates are not available in the current mode",
      });
      return;
    }
    try {
      const { model_group_alias } = req.body;

      if (
        !model_group_alias ||
        typeof model_group_alias !== "object" ||
        Array.isArray(model_group_alias)
      ) {
        res.status(400).json({ error: "model_group_alias object is required" });
        return;
      }

      for (const [model, alias] of Object.entries(model_group_alias)) {
        if (typeof model !== "string") {
          res
            .status(400)
            .json({ error: "model_group_alias keys must be strings" });
          return;
        }
        if (typeof alias !== "string") {
          res
            .status(400)
            .json({ error: "model_group_alias values must be strings" });
          return;
        }
      }

      await dataSource.updateAgentRoutingConfig(model_group_alias);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ── Agent Config (local JSON file) ──

  /**
   * Regenerates ALL aliases for ALL agents and categories.
   * Called after any save to ensure consistency with global fallback.
   */
  async function regenerateAllAliases(
    dataSource: AnalyticsDataSource,
  ): Promise<void> {
    if (!dataSource.capabilities.agentRouting) return;

    const { readDb } = await import("@lite-llm/agents-manager");
    const { generateLitellmAliases } = await import("@lite-llm/alias-router");
    const db = await readDb();
    const globalFallback = db.globalFallbackModel;

    const allAliases: Record<string, string> = {};

    for (const [key, agent] of Object.entries(db.agents || {})) {
      const aliases = generateLitellmAliases(
        key,
        agent.model || "",
        agent.fallbackModels,
        globalFallback,
      );
      Object.assign(allAliases, aliases);
    }

    for (const [key, category] of Object.entries(db.categories || {})) {
      const aliases = generateLitellmAliases(
        key,
        category.model || "",
        category.fallbackModels,
        globalFallback,
      );
      Object.assign(allAliases, aliases);
    }

    await dataSource.updateAgentRoutingConfig(allAliases);
  }

  async function syncGeneratedArtifacts(
    dataSource: AnalyticsDataSource,
  ): Promise<void> {
    const {
      readConfigFile,
      syncOutputConfigFile,
      syncToLiteLLM,
      writeProvidersFile,
      writeVscodeModelsFile,
    } = await import("@lite-llm/agents-manager");

    const config = await readConfigFile();
    const models = dataSource.capabilities.models
      ? await dataSource.getModels()
      : [];

    await writeProvidersFile(config, models);
    await writeVscodeModelsFile(models);
    await syncOutputConfigFile();
    await syncToLiteLLM();
  }

  app.get("/agent-config/global-fallback", async (_req, res) => {
    try {
      const { readDb } = await import("@lite-llm/agents-manager");
      const db = await readDb();
      res.json({ globalFallbackModel: db.globalFallbackModel || "gpt-5.1" });
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
      await syncGeneratedArtifacts(dataSource);

      await regenerateAllAliases(dataSource);

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
        res.json({ type: "category", key, config: config.categories?.[key] });
      } else {
        res
          .status(404)
          .json({ error: `No agent or category found with key "${key}"` });
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

      let existingAliases: Record<string, string> = {};
      if (dataSource.capabilities.agentRouting) {
        const existingRouting = await dataSource.getAgentRoutingConfig();
        existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};
      }

      const { resolveConfiguredModels } = await import(
        "@lite-llm/alias-router"
      );
      const { actualModel, actualFallbacks } = resolveConfiguredModels(
        key,
        String(rawConfig.model || ""),
        (rawConfig.fallback_models as string[] | undefined) || [],
        existingAliases,
      );

      // Save actual (real) model names to db.json - the agentsToOutputConfigs function
      // will transform them back to aliases when generating output config files
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

      await syncGeneratedArtifacts(dataSource);

      if (syncAliases) {
        await regenerateAllAliases(dataSource);
      }

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

      if (rawAgents && typeof rawAgents === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawAgents as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ""),
            (rawCfg.fallback_models as string[] | undefined) || [],
            {},
          );

          // Save actual (real) model names to db.json
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
            {},
          );

          // Save actual (real) model names to db.json
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

      await syncGeneratedArtifacts(dataSource);

      await regenerateAllAliases(dataSource);

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
      await syncGeneratedArtifacts(dataSource);

      if (dataSource.capabilities.agentRouting) {
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
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return app;
}

export default createApiServer;
