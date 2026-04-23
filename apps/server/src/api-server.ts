import express, { type Application } from 'express';
import type { AnalyticsDataSource } from './data-source/types.js';

export function createApiServer(dataSource: AnalyticsDataSource): Application {
  const app = express();
  app.use(express.json());

  app.get('/mode', (_req, res) => {
    const { capabilities } = dataSource;
    let mode: string;
    if (capabilities.errorLogs && capabilities.createModel) {
      mode = 'database';
    } else if (capabilities.errorLogs && !capabilities.createModel) {
      mode = 'limited';
    } else {
      mode = 'api-only';
    }
    res.json({
      mode,
      capabilities,
    });
  });

  app.get('/spend/model', async (_req, res) => {
    try {
      const data = await dataSource.getSpendByModel();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/logs/count', async (req, res) => {
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

  app.get('/spend/logs', async (req, res) => {
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

  app.get('/spend/user', async (_req, res) => {
    try {
      const data = await dataSource.getSpendByUser();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/key', async (_req, res) => {
    try {
      const data = await dataSource.getSpendByKey();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/errors', async (req, res) => {
    if (!dataSource.capabilities.errorLogs) {
      res.status(501).json({
        error: 'Error logs are not available in API-only mode',
      });
      return;
    }

    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const data = await dataSource.getErrorLogs(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/metrics', async (_req, res) => {
    try {
      const data = await dataSource.getMetricsSummary();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/trend', async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const data = await dataSource.getDailySpendTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/tokens', async (_req, res) => {
    try {
      const data = await dataSource.getTokenDistribution();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/performance', async (_req, res) => {
    try {
      const data = await dataSource.getPerformanceMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/temporal', async (_req, res) => {
    try {
      const data = await dataSource.getHourlyUsagePatterns();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/keys', async (_req, res) => {
    try {
      const data = await dataSource.getApiKeyStats();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/cost-efficiency', async (_req, res) => {
    try {
      const data = await dataSource.getCostEfficiency();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/model-distribution', async (_req, res) => {
    try {
      const data = await dataSource.getModelDistribution();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/token-trend', async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const data = await dataSource.getDailyTokenTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/model-stats', async (_req, res) => {
    try {
      const data = await dataSource.getModelStatistics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/models', async (_req, res) => {
    try {
      const data = await dataSource.getModels();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/model/details', async (_req, res) => {
    try {
      const data = await dataSource.getModelDetails();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/models', async (req, res) => {
    if (!dataSource.capabilities.createModel) {
      res.status(403).json({ error: 'Operation not allowed in limited mode' });
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

  app.put('/models/:name', async (req, res) => {
    if (!dataSource.capabilities.updateModel) {
      res.status(403).json({ error: 'Operation not allowed in limited mode' });
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
      if (msg.includes('not found') || msg.includes('No row')) {
        res.status(404).json({ error: 'Model not found' });
        return;
      }
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/models/:name', async (req, res) => {
    if (!dataSource.capabilities.deleteModel) {
      res.status(403).json({ error: 'Operation not allowed in limited mode' });
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

  app.post('/models/merge', async (req, res) => {
    if (!dataSource.capabilities.mergeModels) {
      res.status(403).json({ error: 'Operation not allowed in limited mode' });
      return;
    }
    const { sourceModel, targetModel } = req.body;
    if (!sourceModel || !targetModel) {
      res
        .status(400)
        .json({ error: 'sourceModel and targetModel are required' });
      return;
    }
    try {
      await dataSource.mergeModels(sourceModel, targetModel);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/models/logs/:model', async (req, res) => {
    if (!dataSource.capabilities.deleteModelLogs) {
      res.status(403).json({ error: 'Operation not allowed in limited mode' });
      return;
    }
    try {
      const { model } = req.params;
      await dataSource.deleteModelLogs(model);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/agent-routing', async (_req, res) => {
    if (!dataSource.capabilities.agentRouting) {
      res
        .status(501)
        .json({ error: 'Agent routing is not available in the current mode' });
      return;
    }
    try {
      const data = await dataSource.getAgentRoutingConfig();
      res.json(data ?? {});
    } catch (error) {
      const errorMsg = String(error).toLowerCase();
      if (
        errorMsg.includes('does not exist') ||
        errorMsg.includes('relation')
      ) {
        res.json({});
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/agent-routing', async (req, res) => {
    if (!dataSource.capabilities.agentRouting) {
      res.status(501).json({
        error: 'Agent routing updates are not available in the current mode',
      });
      return;
    }
    try {
      const { model_group_alias } = req.body;

      if (
        !model_group_alias ||
        typeof model_group_alias !== 'object' ||
        Array.isArray(model_group_alias)
      ) {
        res.status(400).json({ error: 'model_group_alias object is required' });
        return;
      }

      for (const [model, alias] of Object.entries(model_group_alias)) {
        if (typeof model !== 'string') {
          res
            .status(400)
            .json({ error: 'model_group_alias keys must be strings' });
          return;
        }
        if (typeof alias !== 'string') {
          res
            .status(400)
            .json({ error: 'model_group_alias values must be strings' });
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

  app.get('/agent-config', async (_req, res) => {
    try {
      const { readConfigFile } = await import('./services/config-file.js');
      const config = await readConfigFile();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/agent-config/:key', async (req, res) => {
    try {
      const { readConfigFile } = await import('./services/config-file.js');
      const config = await readConfigFile();
      const key = req.params.key;
      const isAgent = key in (config.agents || {});
      const isCategory = key in (config.categories || {});

      if (isAgent) {
        res.json({ type: 'agent', key, config: config.agents[key] });
      } else if (isCategory) {
        res.json({ type: 'category', key, config: config.categories[key] });
      } else {
        res
          .status(404)
          .json({ error: `No agent or category found with key "${key}"` });
      }
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/agent-config/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const { type, config: rawConfig, syncAliases } = req.body;

      if (!type || !['agent', 'category'].includes(type)) {
        res.status(400).json({ error: 'type must be "agent" or "category"' });
        return;
      }
      if (
        !rawConfig ||
        typeof rawConfig !== 'object' ||
        Array.isArray(rawConfig)
      ) {
        res.status(400).json({ error: 'config object is required' });
        return;
      }

      const actualModel = rawConfig.model || '';
      const actualFallbacks: string[] = rawConfig.fallback_models || [];

      const FALLBACK_MODEL_NAMES = ['gpt-5.3', 'gpt-5.2', 'gpt-5.1'];

      const configToSave = {
        ...rawConfig,
        model: actualModel ? `${key}/gpt-5.4` : '',
        fallback_models: actualFallbacks.map(
          (_: string, i: number) =>
            `${key}/${FALLBACK_MODEL_NAMES[i] || `gpt-5.${3 - i}`}`,
        ),
      };

      const {
        updateAgentInConfig,
        updateCategoryInConfig,
        readConfigFile,
        writeProvidersFile,
        writeVscodeModelsFile,
      } = await import('./services/config-file.js');

      if (type === 'agent') {
        await updateAgentInConfig(key, configToSave);
      } else {
        await updateCategoryInConfig(key, configToSave);
      }

      const config = await readConfigFile();
      const models = dataSource.capabilities.models
        ? await dataSource.getModels()
        : [];
      await writeProvidersFile(config, models);
      await writeVscodeModelsFile(config, models);

      if (syncAliases && dataSource.capabilities.agentRouting) {
        const { generateLitellmAliases, replaceAliasesForAgent } = await import(
          './services/alias-generator.js'
        );
        const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
        const existingRouting = await getAgentRoutingConfig();
        const existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};
        const newAliases = generateLitellmAliases(
          key,
          actualModel,
          actualFallbacks,
        );
        const merged = replaceAliasesForAgent(existingAliases, key, newAliases);
        await updateAgentRoutingConfig(merged);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/agent-config', async (req, res) => {
    try {
      const { agents: rawAgents, categories: rawCategories } = req.body;

      const agentsToSave: Record<string, unknown> = {};
      const categoriesToSave: Record<string, unknown> = {};

      const allNewAliases: Record<string, string> = {};

      if (rawAgents && typeof rawAgents === 'object') {
        const { generateLitellmAliases } = await import(
          './services/alias-generator.js'
        );
        for (const [key, rawCfg] of Object.entries(
          rawAgents as Record<string, Record<string, unknown>>,
        )) {
          const actualModel = (rawCfg.model as string) || '';
          const actualFallbacks: string[] =
            (rawCfg.fallback_models as string[]) || [];

          agentsToSave[key] = {
            ...rawCfg,
            model: actualModel ? `${key}/gpt-5.4` : '',
            fallback_models: actualFallbacks.map(
              (_: string, i: number) => `${key}/gpt-5.${3 - i}`,
            ),
          };

          const aliases = generateLitellmAliases(
            key,
            actualModel,
            actualFallbacks,
          );
          Object.assign(allNewAliases, aliases);
        }
      }

      if (rawCategories && typeof rawCategories === 'object') {
        const { generateLitellmAliases } = await import(
          './services/alias-generator.js'
        );
        for (const [key, rawCfg] of Object.entries(
          rawCategories as Record<string, Record<string, unknown>>,
        )) {
          const actualModel = (rawCfg.model as string) || '';
          const actualFallbacks: string[] =
            (rawCfg.fallback_models as string[]) || [];

          categoriesToSave[key] = {
            ...rawCfg,
            model: actualModel ? `${key}/gpt-5.4` : '',
            fallback_models: actualFallbacks.map(
              (_: string, i: number) => `${key}/gpt-5.${3 - i}`,
            ),
          };

          const aliases = generateLitellmAliases(
            key,
            actualModel,
            actualFallbacks,
          );
          Object.assign(allNewAliases, aliases);
        }
      }

      const { writeFullConfig, readConfigFile, writeProvidersFile, writeVscodeModelsFile } =
        await import('./services/config-file.js');
      await writeFullConfig({
        agents: agentsToSave,
        categories: categoriesToSave,
      });

      const config = await readConfigFile();
      const models = dataSource.capabilities.models
        ? await dataSource.getModels()
        : [];
      await writeProvidersFile(config, models);
      await writeVscodeModelsFile(config, models);

      if (
        dataSource.capabilities.agentRouting &&
        Object.keys(allNewAliases).length > 0
      ) {
        const { replaceAliasesForAgent } = await import(
          './services/alias-generator.js'
        );
        const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
        const existingRouting = await getAgentRoutingConfig();
        let existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};

        const allKeys = new Set([
          ...Object.keys(rawAgents || {}),
          ...Object.keys(rawCategories || {}),
        ]);
        for (const key of allKeys) {
          const keyAliases: Record<string, string> = {};
          for (const [aliasKey, aliasValue] of Object.entries(allNewAliases)) {
            if (aliasKey.startsWith(`${key}/gpt-5.`)) {
              keyAliases[aliasKey] = aliasValue;
            }
          }
          existingAliases = replaceAliasesForAgent(
            existingAliases,
            key,
            keyAliases,
          );
        }

        await updateAgentRoutingConfig(existingAliases);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/agent-config/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const { type } = req.query;

      const { deleteAgentFromConfig, deleteCategoryFromConfig } = await import(
        './services/config-file.js'
      );

      if (type === 'category') {
        await deleteCategoryFromConfig(key);
      } else {
        await deleteAgentFromConfig(key);
      }

      if (dataSource.capabilities.agentRouting) {
        const { getExistingAliasesForAgent } = await import(
          './services/alias-generator.js'
        );
        const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
        const existingRouting = await getAgentRoutingConfig();
        const existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};
        const keysToRemove = getExistingAliasesForAgent(key, existingAliases);
        const deletions: Record<string, string> = {};
        for (const aliasKey of keysToRemove) {
          deletions[aliasKey] = '';
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
