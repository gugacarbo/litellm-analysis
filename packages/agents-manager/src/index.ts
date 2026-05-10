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
  type IModelService,
  ModelService,
  type ModelServiceOptions,
} from "./services/model.service.js";
import {
  type IRoutingService,
  RoutingService,
  type RoutingServiceOptions,
} from "./services/routing.service.js";

// New types
export type {
  AgentExtraConfig,
  AgentVersion,
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "./types/index.js";
export type {
  AgentCatalogServiceOptions,
  AgentServiceOptions,
  CategoryServiceOptions,
  IAgentCatalogService,
  IAgentService,
  ICategoryService,
  IModelService,
  IRoutingService,
  ModelServiceOptions,
  RoutingServiceOptions,
};
export {
  AgentCatalogService,
  AgentService,
  CategoryService,
  ModelService,
  RoutingService,
};

// Plugins
import { OpenCodePlugin } from "./plugins/builtins/opencode.plugin.js";
import { OpenAgentPlugin } from "./plugins/external/openagent.plugin.js";
import { VsCodePlugin } from "./plugins/external/vscode.plugin.js";
import type {
  ConfigField,
  InternalAgent,
} from "./plugins/plugin-types.js";
import type {
  IPlugin,
  IPluginRegistry,
  TransformContext,
} from "./plugins/plugin.js";
import {
  PluginRegistry,
  type PluginRegistryOptions,
} from "./plugins/registry.js";

export type {
  ConfigField,
  IPlugin,
  IPluginRegistry,
  InternalAgent,
  PluginRegistryOptions,
  TransformContext,
};
export { OpenAgentPlugin, OpenCodePlugin, PluginRegistry, VsCodePlugin };

// Config
import { DEFAULT_DB_PATH, DEFAULT_ROUTING, DEFAULT_SYSTEM_AGENTS } from "./config/defaults.js";

export { DEFAULT_DB_PATH, DEFAULT_ROUTING, DEFAULT_SYSTEM_AGENTS };

// ── Factory ──

export interface AgentsManagerFactoryOptions {
  dbPath?: string;
  outputDir?: string;
}

export function createAgentsManager(options: AgentsManagerFactoryOptions = {}) {
  const repository = createRepositoryClient({ filePath: options.dbPath });

  const services = {
    agents: new AgentService({ repository }),
    catalog: new AgentCatalogService({ repository }),
    categories: new CategoryService({ repository }),
    models: new ModelService({ repository }),
    routing: new RoutingService({ repository }),
  };

  const allPlugins: IPlugin[] = [
    new OpenCodePlugin(),
    new OpenAgentPlugin(),
    new VsCodePlugin(),
  ];

  const registry = new PluginRegistry({
    repository,
    outputDir: options.outputDir,
    allPlugins,
  });

  return { repository, services, registry };
}
