// ── Main export file ──

// Re-export types from agents-repository
export type {
  AgentEntry,
  CategoryEntry,
  DbConfig,
  IAgentsRepository,
  ModelSpec,
  RepositoryOptions,
} from "@lite-llm/agents-repository/repository";

// Repository client (wraps agents-repository)
import {
  createRepositoryClient,
  type RepositoryClientOptions,
} from "./repository/client.js";

export { createRepositoryClient, type RepositoryClientOptions };

// Services
import {
  AgentService,
  type AgentServiceOptions,
  type IAgentService,
} from "./services/agent.service.js";
import {
  AgentCatalogService,
  type AgentCatalogServiceOptions,
  type IAgentCatalogService,
} from "./services/agent-catalog.service.js";
import {
  CategoryService,
  type CategoryServiceOptions,
  type ICategoryService,
} from "./services/category.service.js";
import {
  type IRoutingService,
  RoutingService,
  type RoutingServiceOptions,
} from "./services/routing.service.js";

// New types
export type {
  AgentExtraConfig,
  PluginRouting,
  PluginRoutingRule,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
export type {
  AgentCatalogServiceOptions,
  AgentServiceOptions,
  CategoryServiceOptions,
  IAgentCatalogService,
  IAgentService,
  ICategoryService,
  IRoutingService,
  RoutingServiceOptions,
};
export {
  AgentCatalogService,
  AgentService,
  CategoryService,
  RoutingService,
};

// Plugins
import { OpenCodePlugin } from "./plugins/builtins/opencode.plugin.js";
import { LitellmAliasPlugin } from "./plugins/external/litellm-alias.plugin.js";
import { OpenAgentPlugin } from "./plugins/external/openagent.plugin.js";
import { VsCodePlugin } from "./plugins/external/vscode.plugin.js";
import type {
  IPlugin,
  IPluginRegistry,
  TransformContext,
} from "./plugins/plugin.js";
import type { ConfigField, InternalAgent } from "./plugins/plugin-types.js";
import {
  PluginRegistry,
  type PluginRegistryOptions,
} from "./plugins/registry.js";

export type { AliasDbWriter } from "./plugins/external/litellm-alias.plugin.js";
export type {
  ConfigField,
  InternalAgent,
  IPlugin,
  IPluginRegistry,
  PluginRegistryOptions,
  TransformContext,
};
export {
  LitellmAliasPlugin,
  OpenAgentPlugin,
  OpenCodePlugin,
  PluginRegistry,
  VsCodePlugin,
};

// Config
import { DEFAULT_AGENTS, DEFAULT_DB_PATH } from "./config/defaults.js";

export { DEFAULT_AGENTS, DEFAULT_DB_PATH };

// ── Factory ──

export interface AgentsManagerFactoryOptions {
  dbPath?: string;
  outputDir?: string;
  aliasDbWriter?: import("./plugins/external/litellm-alias.plugin.js").AliasDbWriter;
}

export function createAgentsManager(options: AgentsManagerFactoryOptions = {}) {
  const repository = createRepositoryClient({ filePath: options.dbPath });

  const services = {
    agents: new AgentService({ repository }),
    catalog: new AgentCatalogService({ repository }),
    categories: new CategoryService({ repository }),
    routing: new RoutingService({ repository }),
  };

  const allPlugins: IPlugin[] = [
    new OpenCodePlugin(),
    new OpenAgentPlugin(),
    new VsCodePlugin(),
    new LitellmAliasPlugin(options.aliasDbWriter),
  ];

  const registry = new PluginRegistry({
    repository,
    outputDir: options.outputDir,
    allPlugins,
  });

  return { repository, services, registry };
}
