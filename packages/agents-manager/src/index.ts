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
  CategoryService,
  type CategoryServiceOptions,
  type ICategoryService,
} from "./services/category.service.js";
import {
  type IModelService,
  ModelService,
  type ModelServiceOptions,
} from "./services/model.service.js";

export type {
  AgentServiceOptions,
  CategoryServiceOptions,
  IAgentService,
  ICategoryService,
  IModelService,
  ModelServiceOptions,
};
export { AgentService, CategoryService, ModelService };

import { OpenAgentPlugin } from "./plugins/builtins/openagent.plugin.js";
import { OpenCodePlugin } from "./plugins/builtins/opencode.plugin.js";
import { VsCodePlugin } from "./plugins/builtins/vscode.plugin.js";
import type {
  IPlugin,
  IPluginRegistry,
  TransformContext,
} from "./plugins/plugin.js";
// Plugins
import {
  PluginRegistry,
  type PluginRegistryOptions,
} from "./plugins/registry.js";

export type {
  IPlugin,
  IPluginRegistry,
  PluginRegistryOptions,
  TransformContext,
};
export { OpenAgentPlugin, OpenCodePlugin, PluginRegistry, VsCodePlugin };

// Config
import {
  DEFAULT_FILE_PATHS,
  type FilePaths,
  getFilePaths,
} from "./config/defaults.js";

export type { FilePaths };
export { DEFAULT_FILE_PATHS, getFilePaths };

// ── Factory ──

export interface AgentsManagerFactoryOptions {
  dbPath?: string;
  outputDir?: string;
  registerBuiltins?: boolean;
}

export function createAgentsManager(options: AgentsManagerFactoryOptions = {}) {
  const repository = createRepositoryClient({ filePath: options.dbPath });

  const services = {
    agents: new AgentService({ repository }),
    categories: new CategoryService({ repository }),
    models: new ModelService({ repository }),
  };

  const registry = new PluginRegistry({
    repository,
    outputDir: options.outputDir,
  });

  if (options.registerBuiltins !== false) {
    registry.register(new OpenCodePlugin());
    registry.register(new OpenAgentPlugin());
    registry.register(new VsCodePlugin());
  }

  return { repository, services, registry };
}
