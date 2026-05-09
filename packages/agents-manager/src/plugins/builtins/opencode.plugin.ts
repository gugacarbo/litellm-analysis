import type {
  AgentEntry,
  CategoryEntry,
  DbConfig,
  ModelSpec,
} from "@lite-llm/agents-repository/repository";
import type { PluginRoutingConfig } from "../../types/routing.js";
import type { AgentVersion, SystemAgent } from "../../types/system-agent.js";
import type {
  IPlugin,
  PluginEntry,
  PluginModel,
  TransformContext,
} from "../plugin.js";

const CURRENT_VERSION = 1;
const LITELLM_API_KEY_REF = "{env:LITELLM_API_KEY}";

interface OpenCodeProviders {
  provider: Record<string, unknown>;
}

export class OpenCodePlugin implements IPlugin {
  readonly id = "opencode";
  readonly name = "OpenCode AI SDK";
  readonly version = CURRENT_VERSION;
  readonly builtin = true;
  readonly outputFile = "opencode.json";

  // ── New Generic Methods ──

  transformAgent(
    agent: SystemAgent,
    version: AgentVersion,
    ctx: TransformContext,
  ): PluginEntry {
    return {
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: ctx.litellmConfig.apiKey,
      },
      models: {
        [version.id]: {
          id: `${agent.id}/${version.id}`,
          name: `${agent.displayName} ${version.displayName}`,
          limit: {
            context: version.limits.context,
            output: version.limits.output,
          },
        },
      },
    };
  }

  buildOutputV2(
    agents: SystemAgent[],
    routing: PluginRoutingConfig,
    ctx: TransformContext,
  ): OpenCodeProviders {
    const output: OpenCodeProviders = { provider: {} };

    // Build litellm provider with all models
    output.provider.litellm = this.buildLitellmProviderV2(ctx);

    // Get routing config for this plugin
    const pluginRouting = routing.plugins[this.id];
    if (!pluginRouting) return output;

    // Add agent providers
    for (const agent of agents) {
      const agentRouting = pluginRouting.agents[agent.id];
      if (!agentRouting?.enabled) continue;

      // Build models for each version, applying overrides
      const models: Record<string, unknown> = {};
      for (const version of agent.versions) {
        const resolvedVersion =
          agentRouting.versionOverrides?.[version.id] ?? version;
        const entry = this.transformAgent(agent, resolvedVersion, ctx);
        Object.assign(models, entry.models);
      }

      output.provider[agent.id] = {
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: ctx.litellmConfig.baseUrl,
          apiKey: ctx.litellmConfig.apiKey,
        },
        models,
      };
    }

    return output;
  }

  // ── Legacy Methods (backward compat) ──

  transformEntry(
    _entry: AgentEntry | CategoryEntry,
    ctx: TransformContext,
  ): Record<string, unknown> {
    return {
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: LITELLM_API_KEY_REF,
      },
      models: this.buildAgentModels(ctx.entryKey, ctx.allModels),
    };
  }

  transformModel(key: string, spec: ModelSpec): PluginModel {
    return {
      id: key,
      name: spec.displayName,
      limit: {
        context: spec.contextLength,
        output: spec.maxOutput,
      },
      cost: spec.cost,
    };
  }

  preprocess(_config: DbConfig): unknown {
    return { provider: {} };
  }

  buildOutput(config: DbConfig, _context: TransformContext): OpenCodeProviders {
    const output: OpenCodeProviders = { provider: {} };

    // Build litellm provider with all models
    output.provider.litellm = this.buildLitellmProvider(config);

    // Add agent providers
    for (const [key, entry] of Object.entries(config.agents)) {
      if (Object.keys(entry).length === 0) continue;
      output.provider[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "agent",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }

    // Add category providers
    for (const [key, entry] of Object.entries(config.categories)) {
      if (Object.keys(entry).length === 0) continue;
      output.provider[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "category",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }

  // ── Private Helpers ──

  private buildLitellmProvider(config: DbConfig): Record<string, unknown> {
    const models: Record<string, PluginModel> = {};

    for (const [key, spec] of Object.entries(config.models)) {
      const model = this.transformModel(key, spec);
      models[key] = model;
    }

    return {
      name: "LiteLLM",
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: config.litellm.baseUrl,
        apiKey: config.litellm.apiKey,
      },
      models,
    };
  }

  private buildLitellmProviderV2(
    ctx: TransformContext,
  ): Record<string, unknown> {
    const models: Record<string, PluginModel> = {};

    for (const [key, spec] of Object.entries(ctx.allModels)) {
      const model = this.transformModel(key, spec);
      models[key] = model;
    }

    return {
      name: "LiteLLM",
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: ctx.litellmConfig.apiKey,
      },
      models,
    };
  }

  private buildAgentModels(
    prefix: string,
    allModels: Record<string, ModelSpec>,
  ): Record<string, unknown> {
    const models: Record<string, unknown> = {};

    for (const [modelKey] of Object.entries(allModels)) {
      models[modelKey] = {
        id: `${prefix}/${modelKey}`,
        name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${modelKey}`,
      };
    }

    return models;
  }
}
