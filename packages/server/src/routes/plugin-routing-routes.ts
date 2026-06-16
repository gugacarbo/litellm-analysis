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

const normalizePluginConfigPayload = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  if (!isWrappedPluginConfig(value)) {
    return value;
  }

  const nested = value.config;
  if (!isRecord(nested)) {
    return {};
  }

  return normalizePluginConfigPayload(nested);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

function normalizePluginId(pluginId: string): string {
  return pluginId === "litellm-alias" ? "model-alias" : pluginId;
}

const normalizePluginConfigById = (
  pluginId: string,
  value: unknown,
): Record<string, unknown> => {
  pluginId = normalizePluginId(pluginId);
  const config = asRecord(value);

  if (pluginId === "openagent") {
    const gitMaster = asRecord(config.git_master);
    return {
      $schema: config.$schema,
      git_master: {
        commit_footer: gitMaster.commit_footer ?? config.commitFooter ?? false,
        include_co_authored_by:
          gitMaster.include_co_authored_by ??
          config.includeCoAuthoredBy ??
          false,
      },
    };
  }

  if (pluginId === "opencode") {
    return {
      $schema: config.$schema,
      model: (config.model as string | undefined) ?? config.defaultModel ?? "",
    };
  }

  if (pluginId === "vscode") {
    const retry = asRecord(config["oaicopilot.retry"]);
    return {
      "oaicopilot.commitLanguage":
        config["oaicopilot.commitLanguage"] ?? config.commitLanguage,
      "oaicopilot.baseUrl":
        config["oaicopilot.baseUrl"] ?? config.baseUrl ?? "",
      "oaicopilot.delay": config["oaicopilot.delay"] ?? config.delay ?? 0,
      "oaicopilot.readFileLines":
        config["oaicopilot.readFileLines"] ?? config.readFileLines ?? 0,
      "oaicopilot.retry": {
        enabled: retry.enabled ?? config.retryEnabled ?? true,
        max_attempts: retry.max_attempts ?? config.maxRetryAttempts ?? 3,
        interval_ms: retry.interval_ms ?? config.retryIntervalMs ?? 2000,
        status_codes: retry.status_codes ?? config.retryStatusCodes ?? [],
      },
      "oaicopilot.models": config["oaicopilot.models"] ?? [],
    };
  }

  if (pluginId === "weave") {
    const tmux = asRecord(config.tmux);
    const analytics = asRecord(config.analytics);
    const continuation = asRecord(config.continuation);
    const recovery = asRecord(continuation.recovery);
    const idle = asRecord(continuation.idle);
    return {
      $schema: config.$schema,
      log_level: config.log_level ?? config.logLevel ?? "INFO",
      tmux: {
        enabled: tmux.enabled ?? config.tmuxEnabled ?? true,
      },
      analytics: {
        enabled: analytics.enabled ?? config.analyticsEnabled ?? true,
        use_fingerprint:
          analytics.use_fingerprint ?? config.analyticsUseFingerprint ?? true,
      },
      continuation: {
        recovery: {
          compaction:
            recovery.compaction ??
            config.continuationRecoveryCompaction ??
            true,
        },
        idle: {
          enabled: idle.enabled ?? config.continuationIdleEnabled ?? true,
          work: idle.work ?? config.continuationIdleWork ?? true,
          workflow: idle.workflow ?? true,
          todo_prompt:
            idle.todo_prompt ?? config.continuationIdleTodoPrompt ?? true,
        },
      },
      skill_directories:
        config.skill_directories ?? config.skillDirectories ?? [],
    };
  }

  if (pluginId === "model-alias") {
    return {
      $schema: config.$schema,
      model_group_alias: config.model_group_alias ?? {},
    };
  }

  return config;
};

const normalizePluginRoutingMap = (
  plugins: Record<string, PluginRouting>,
): Record<string, PluginRoutingInput> => {
  const normalized: Record<string, PluginRoutingInput> = {};
  for (const [pluginId, plugin] of Object.entries(plugins)) {
    const normalizedPluginId = normalizePluginId(pluginId);
    normalized[normalizedPluginId] = {
      ...plugin,
      config: normalizePluginConfigById(normalizedPluginId, plugin.config),
    };
  }
  return normalized;
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

      const normalizedPlugins = normalizePluginRoutingMap(plugins);
      const config = await manager.repository.read();
      config.plugins = normalizedPlugins;
      await manager.repository.write(config);
      manager.registry.loadFromConfig(normalizedPlugins);
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
      const pluginId = normalizePluginId(req.params.pluginId);
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
          configSchema: registry.getConfigSchema(pluginId),
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
      const pluginId = normalizePluginId(req.params.pluginId);
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

      const [
        pluginConfig,
        agentMappings,
        categoryMappings,
        schema,
        internalAgents,
      ] = await Promise.all([
        services.routing.getPluginConfig(pluginId),
        services.routing.getAgentMappings(pluginId),
        services.routing.getCategoryMappings(pluginId),
        Promise.resolve(registry.getConfigSchema(pluginId)),
        Promise.resolve(registry.getInternalAgents(pluginId)),
      ]);

      const normalizedCurrentConfig = isRecord(pluginConfig?.config)
        ? normalizePluginConfigPayload(pluginConfig.config)
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
        config: normalizedCurrentConfig,
        agentMappings,
        categoryMappings,
        schema,
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
      const pluginId = normalizePluginId(req.params.pluginId);
      const { config, agentMappings, categoryMappings } = req.body as {
        config?: Record<string, unknown>;
        agentMappings?: Record<string, string>;
        categoryMappings?: Record<string, boolean>;
      };
      const normalizedConfig =
        config !== undefined
          ? normalizePluginConfigById(
              pluginId,
              normalizePluginConfigPayload(config),
            )
          : undefined;

      const current = await services.routing.getPluginConfig(pluginId);

      if (!current) {
        // Create new plugin config
        const updated: PluginRoutingInput = {
          enabled: true,
          outputFile: `${pluginId}.json`,
          config: normalizedConfig ?? {},
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
          config:
            normalizedConfig !== undefined ? normalizedConfig : current.config,
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
      const pluginId = normalizePluginId(req.params.pluginId);
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
