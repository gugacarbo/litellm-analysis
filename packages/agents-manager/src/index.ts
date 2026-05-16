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
} from "./repository/client";

export { createRepositoryClient, type RepositoryClientOptions };

// Services
import {
  AgentService,
  type AgentServiceOptions,
  type IAgentService,
} from "./services/agent.service";
import {
  AgentCatalogService,
  type AgentCatalogServiceOptions,
  type IAgentCatalogService,
} from "./services/agent-catalog.service";
import {
  CategoryService,
  type CategoryServiceOptions,
  type ICategoryService,
} from "./services/category.service";
import {
  type IRoutingService,
  RoutingService,
  type RoutingServiceOptions,
} from "./services/routing.service";

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
export { AgentCatalogService, AgentService, CategoryService, RoutingService };

import { createRepositoryClient as createModelsRepositoryClient } from "@lite-llm/models-manager";
import { LitellmAliasPlugin } from "./plugins/litellm-alias/plugin";
import { OpenAgentPlugin } from "./plugins/openagent/plugin";
// Plugins
import { OpenCodePlugin } from "./plugins/opencode/plugin";
import type {
  IPlugin,
  IPluginRegistry,
  TransformContext,
} from "./plugins/plugin";
import type { ConfigField, InternalAgent } from "./plugins/plugin-types";
import { PluginRegistry, type PluginRegistryOptions } from "./plugins/registry";
import { VsCodePlugin } from "./plugins/vscode/plugin";

export type { AliasDbWriter } from "./plugins/litellm-alias/plugin";
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
import { DEFAULT_AGENTS, DEFAULT_DB_PATH } from "./config/defaults";

export { DEFAULT_AGENTS, DEFAULT_DB_PATH };

// ── Factory ──

export interface AgentsManagerFactoryOptions {
  dbPath?: string;
  modelsDbPath?: string;
  outputDir?: string;
  aliasDbWriter?: import("./plugins/litellm-alias/plugin.js").AliasDbWriter;
}

export function createAgentsManager(options: AgentsManagerFactoryOptions = {}) {
  const repository = createRepositoryClient({ filePath: options.dbPath });
  const modelsRepository = createModelsRepositoryClient({
    filePath: options.modelsDbPath,
  });

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
    modelsRepository,
    outputDir: options.outputDir,
    allPlugins,
  });

  return { repository, services, registry };
}
