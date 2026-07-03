import type { PluginRoutingInput } from "@lite-llm/agent-plugins";
import type { PluginRouting } from "@lite-llm/agents-repository/schemas";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWrappedPluginConfig = (value: Record<string, unknown>): boolean =>
  "enabled" in value &&
  "outputFile" in value &&
  "routing" in value &&
  "config" in value;

const LEGACY_PLUGIN_CONFIG_KEYS: Record<string, string[]> = {
  "model-alias": ["aliasPrefix", "includeAgents", "includeCategories"],
  openagent: ["commitFooter", "includeCoAuthoredBy"],
  opencode: ["defaultModel"],
  vscode: [
    "commitLanguage",
    "baseUrl",
    "delay",
    "readFileLines",
    "retryEnabled",
    "maxRetryAttempts",
    "retryIntervalMs",
    "retryStatusCodes",
  ],
  weave: [
    "logLevel",
    "tmuxEnabled",
    "analyticsEnabled",
    "analyticsUseFingerprint",
    "continuationRecoveryCompaction",
    "continuationIdleEnabled",
    "continuationIdleWork",
    "continuationIdleTodoPrompt",
    "skillDirectories",
  ],
};

const findLegacyPluginConfigIssue = (
  pluginId: string,
  value: unknown,
): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (isWrappedPluginConfig(value)) {
    return `Plugin "${pluginId}" config must be sent as the raw current config object`;
  }

  const legacyKeys = LEGACY_PLUGIN_CONFIG_KEYS[pluginId];
  if (!legacyKeys) {
    return null;
  }

  const foundKey = legacyKeys.find((key) => key in value);
  if (!foundKey) {
    return null;
  }

  return `Plugin "${pluginId}" no longer accepts legacy config field "${foundKey}"`;
};

const validatePluginRoutingMap = (
  plugins: Record<string, PluginRouting>,
): string | null => {
  for (const [pluginId, plugin] of Object.entries(plugins)) {
    if (!isRecord(plugin)) {
      return `Plugin "${pluginId}" entry must be an object`;
    }

    const issue = findLegacyPluginConfigIssue(pluginId, plugin.config);
    if (issue) {
      return issue;
    }
  }

  return null;
};

interface PluginInfoDTO {
  id: string;
  name: string;
  enabled: boolean;
  outputFile: string;
  internalAgents: Array<{
    id: string;
    displayName: string;
    description: string;
  }>;
  configSchema: Array<{
    key: string;
    type: string;
    label: string;
    required?: boolean;
    default?: unknown;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    description?: string;
  }>;
  agentCount: number;
  enabledAgentCount: number;
}

export function registerPluginRoutingRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  // GET /plugin-routing — returns all plugin configs
  app.get("/plugin-routing", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const config = await manager.repository.read();
      res.json(config.plugins ?? {});
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PUT /plugin-routing — saves the entire plugins map
  app.put("/plugin-routing", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const plugins = req.body as Record<string, PluginRouting>;

      if (!plugins || typeof plugins !== "object") {
        res.status(400).json({ error: "Plugins map object is required" });
        return;
      }

      const validationIssue = validatePluginRoutingMap(plugins);
      if (validationIssue) {
        res.status(400).json({ error: validationIssue });
        return;
      }

      const config = await manager.repository.read();
      config.plugins = plugins as Record<string, PluginRoutingInput>;
      await manager.repository.write(config);
      manager.registry.loadFromConfig(config.plugins);
      await manager.registry.exportAll();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PATCH /plugin-routing/:pluginId/agents/:agentId — toggles agent plugin
  app.patch("/plugin-routing/:pluginId/agents/:agentId", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const pluginId = req.params.pluginId;
      const { agentId } = req.params;
      const newEnabled = await manager.services.routing.toggleAgentPlugin(
        pluginId,
        agentId,
      );
      await manager.registry.exportAll();
      res.json({ enabled: newEnabled });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /plugin-routing/plugins — lists plugins with routing info
  app.get("/plugin-routing/plugins", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { registry } = manager;
      const config = await manager.repository.read();

      const totalAgentCount = Object.keys(config.agents ?? {}).length;

      const plugins: PluginInfoDTO[] = registry.listAll().map((p) => {
        const pluginId = p.manifest.id;
        const pc = config.plugins?.[pluginId];
        const mappedAgentCount = Object.keys(pc?.routing?.agents ?? {}).length;

        return {
          id: pluginId,
          name: p.manifest.displayName,
          enabled: pc?.enabled ?? false,
          outputFile: pc?.outputFile ?? p.manifest.output.fileName,
          internalAgents: registry.getInternalAgents(pluginId),
          configSchema: [],
          agentCount: totalAgentCount,
          enabledAgentCount: mappedAgentCount,
        };
      });

      res.json(plugins);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /plugin-routing/:pluginId/schema
  app.get("/plugin-routing/:pluginId/schema", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const pluginId = req.params.pluginId;
      const schema = manager.registry.getJsonSchema(pluginId);

      if (!schema) {
        res
          .status(404)
          .json({ error: `Schema for plugin "${pluginId}" not found` });
        return;
      }

      res.json({ schema });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /plugin-routing/:pluginId/config
  app.get("/plugin-routing/:pluginId/config", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { pluginId } = req.params;
      const { services, registry } = manager;

      const [pluginConfig, agentMappings, categoryMappings, internalAgents] =
        await Promise.all([
          services.routing.getPluginConfig(pluginId),
          services.routing.getAgentMappings(pluginId),
          services.routing.getCategoryMappings(pluginId),
          Promise.resolve(registry.getInternalAgents(pluginId)),
        ]);

      const currentConfig = isRecord(pluginConfig?.config)
        ? pluginConfig.config
        : {};

      // Fetch models context for plugins that need it (e.g. OpenCode)
      let allModels: Record<string, unknown> = {};
      let modelProxyProvider: { baseUrl: string; name: string } = {
        baseUrl: "",
        name: "",
      };
      try {
        const [models, provider] = await Promise.all([
          opts.modelsService.getAll(),
          opts.providerService.get("local-proxy"),
        ]);
        allModels = models ?? {};
        if (provider) {
          modelProxyProvider = {
            baseUrl: provider.baseUrl ?? "",
            name: provider.name ?? "Local Model Proxy",
          };
        }
      } catch {
        // Keep empty context when models service isn't available
      }

      res.json({
        config: currentConfig,
        agentMappings,
        categoryMappings,
        schema: [],
        internalAgents,
        allModels,
        modelProxyProvider,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PUT /plugin-routing/:pluginId/config — saves plugin config with merge
  app.put("/plugin-routing/:pluginId/config", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const pluginId = req.params.pluginId;
      const { config, agentMappings, categoryMappings } = req.body as {
        config?: unknown;
        agentMappings?: Record<string, string>;
        categoryMappings?: Record<string, boolean>;
      };
      if (config !== undefined && !isRecord(config)) {
        res.status(400).json({ error: "Plugin config must be an object" });
        return;
      }

      const validationIssue = findLegacyPluginConfigIssue(pluginId, config);
      if (validationIssue) {
        res.status(400).json({ error: validationIssue });
        return;
      }

      const current = await services.routing.getPluginConfig(pluginId);

      if (!current) {
        // Create new plugin config
        const updated: PluginRoutingInput = {
          enabled: true,
          outputFile: `${pluginId}.json`,
          config: config ?? {},
          routing: {
            agents: agentMappings ?? {},
            categories: categoryMappings ?? {},
          },
        };
        await services.routing.savePluginConfig(pluginId, updated);
      } else {
        // Merge changes into existing config
        const updated: PluginRoutingInput = {
          ...current,
          config: config !== undefined ? config : current.config,
          routing: {
            agents:
              agentMappings !== undefined
                ? agentMappings
                : (current.routing?.agents ?? {}),
            categories:
              categoryMappings !== undefined
                ? categoryMappings
                : (current.routing?.categories ?? {}),
          },
        };
        await services.routing.savePluginConfig(pluginId, updated);
      }

      const fullConfig = await manager.repository.read();
      manager.registry.loadFromConfig(fullConfig.plugins ?? {});
      await manager.registry.exportAll();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PATCH /plugin-routing/:pluginId/categories/:categoryId — toggles category mapping
  app.patch(
    "/plugin-routing/:pluginId/categories/:categoryId",
    async (req, res) => {
      try {
        const manager = opts.agentsManager;
        if (!manager) {
          res.status(500).json({ error: "AgentsManager not configured" });
          return;
        }
        const { services } = manager;
        const pluginId = req.params.pluginId;
        const { categoryId } = req.params;
        const enabled = await services.routing.toggleCategoryMapping(
          pluginId,
          categoryId,
        );
        await manager.registry.exportAll();
        res.json({ categoryId, enabled });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );
}
