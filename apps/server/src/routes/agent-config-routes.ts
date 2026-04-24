import type { AnalyticsDataSource } from '@lite-llm/analytics/types';
import type { Application } from 'express';

export function registerAgentConfigRoutes(app: Application, dataSource: AnalyticsDataSource) {
  // ── Global Fallback Model ──

  app.get('/agent-config/global-fallback', async (_req, res) => {
    try {
      const { readDb } = await import('@lite-llm/config-generator');
      const db = await readDb();
      res.json({ globalFallbackModel: db.globalFallbackModel || 'gpt-5' });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/agent-config/global-fallback', async (req, res) => {
    try {
      const { globalFallbackModel } = req.body as { globalFallbackModel?: string };
      const { readDb, writeDb } = await import('@lite-llm/config-generator');
      const db = await readDb();
      db.globalFallbackModel = globalFallbackModel || 'gpt-5';
      await writeDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ── Agent Config (local JSON file) ──

  app.get('/agent-config', async (_req, res) => {
    try {
      const { readConfigFile } = await import('@lite-llm/config-generator');
      const config = await readConfigFile();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/agent-config/:key', async (req, res) => {
    try {
      const key = req.params.key;
      if (key === 'global-fallback') {
        res.status(404).json({ error: 'Use /agent-config/global-fallback for global fallback' });
        return;
      }
      const { readConfigFile } = await import('@lite-llm/config-generator');
      const config = await readConfigFile();
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
      if (key === 'global-fallback') {
        res.status(404).json({ error: 'Use PUT /agent-config/global-fallback for global fallback' });
        return;
      }
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

      let existingAliases: Record<string, string> = {};
      if (dataSource.capabilities.agentRouting) {
        const existingRouting = await dataSource.getAgentRoutingConfig();
        existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};
      }

      const { resolveConfiguredModels } = await import(
        '@lite-llm/alias-router'
      );
      const { actualModel, actualFallbacks } = resolveConfiguredModels(
        key,
        String(rawConfig.model || ''),
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

      const {
        updateAgentInConfig,
        updateCategoryInConfig,
        readConfigFile,
        writeProvidersFile,
        writeVscodeModelsFile,
      } = await import('@lite-llm/config-generator');

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
      await writeVscodeModelsFile(models);

      if (syncAliases && dataSource.capabilities.agentRouting) {
        const { generateLitellmAliases, replaceAliasesForAgent } = await import(
          '@lite-llm/alias-router'
        );
        const { updateAgentRoutingConfig } = dataSource;
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

      const agentsToSave: Record<string, AgentConfig> = {};
      const categoriesToSave: Record<string, CategoryConfig> = {};

      const allNewAliases: Record<string, string> = {};
      let existingAliases: Record<string, string> = {};
      if (dataSource.capabilities.agentRouting) {
        const existingRouting = await dataSource.getAgentRoutingConfig();
        existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};
      }

      const {
        generateLitellmAliases,
        replaceAliasesForAgent,
        resolveConfiguredModels,
      } = await import('@lite-llm/alias-router');

      if (rawAgents && typeof rawAgents === 'object') {
        for (const [key, rawCfg] of Object.entries(
          rawAgents as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ''),
            (rawCfg.fallback_models as string[] | undefined) || [],
            existingAliases,
          );

          // Save actual (real) model names to db.json
          agentsToSave[key] = {
            ...rawCfg,
            model: actualModel,
            fallback_models: actualFallbacks,
          } as AgentConfig;

          const aliases = generateLitellmAliases(
            key,
            actualModel,
            actualFallbacks,
          );
          Object.assign(allNewAliases, aliases);
          existingAliases = replaceAliasesForAgent(
            existingAliases,
            key,
            aliases,
          );
        }
      }

      if (rawCategories && typeof rawCategories === 'object') {
        for (const [key, rawCfg] of Object.entries(
          rawCategories as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ''),
            (rawCfg.fallback_models as string[] | undefined) || [],
            existingAliases,
          );

          // Save actual (real) model names to db.json
          categoriesToSave[key] = {
            ...rawCfg,
            model: actualModel,
            fallback_models: actualFallbacks,
          } as CategoryConfig;

          const aliases = generateLitellmAliases(
            key,
            actualModel,
            actualFallbacks,
          );
          Object.assign(allNewAliases, aliases);
          existingAliases = replaceAliasesForAgent(
            existingAliases,
            key,
            aliases,
          );
        }
      }

      const {
        writeFullConfig,
        readConfigFile,
        writeProvidersFile,
        writeVscodeModelsFile,
      } = await import('@lite-llm/config-generator');
      await writeFullConfig({
        agents: agentsToSave,
        categories: categoriesToSave,
      });

      const config = await readConfigFile();
      const models = dataSource.capabilities.models
        ? await dataSource.getModels()
        : [];
      await writeProvidersFile(config, models);
      await writeVscodeModelsFile(models);

      if (
        dataSource.capabilities.agentRouting &&
        Object.keys(allNewAliases).length > 0
      ) {
        const { replaceAliasesForAgent } = await import(
          '@lite-llm/alias-router'
        );
        const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
        const existingRouting = await getAgentRoutingConfig();
        let aliasesToPersist = existingRouting?.model_group_alias
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
          aliasesToPersist = replaceAliasesForAgent(
            aliasesToPersist,
            key,
            keyAliases,
          );
        }

        await updateAgentRoutingConfig(aliasesToPersist);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/agent-config/:key', async (req, res) => {
    try {
      const key = req.params.key;
      if (key === 'global-fallback') {
        res.status(404).json({ error: 'Global fallback cannot be deleted' });
        return;
      }
      const { type } = req.query;

      const { deleteAgentFromConfig, deleteCategoryFromConfig } = await import(
        '@lite-llm/config-generator'
      );

      if (type === 'category') {
        await deleteCategoryFromConfig(key);
      } else {
        await deleteAgentFromConfig(key);
      }

      if (dataSource.capabilities.agentRouting) {
        const { getExistingAliasesForAgent } = await import(
          '@lite-llm/alias-router'
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
}

// Define types that were referenced but not imported
interface AgentConfig {
  model: string;
  fallback_models?: string[];
  [key: string]: unknown;
}

interface CategoryConfig {
  model: string;
  fallback_models?: string[];
  [key: string]: unknown;
}
