// ── Factory: Combines agents-manager services with plugin registry ──

import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { IModelsRepository } from "@lite-llm/models-repository/repository";
import type { IPlugin } from "./plugins/plugin";
import { PluginRegistry } from "./plugins/registry";

export type { IPlugin };

// Plugin routing type (allows undefined fields)
export interface PluginRoutingInput {
  enabled?: boolean;
  outputFile?: string;
  config?: Record<string, unknown>;
  routing?: {
    agents?: Record<string, string>;
    categories?: Record<string, boolean>;
  };
}

// Agent services from @lite-llm/agents-manager
export interface AgentServices {
  agents: {
    getAll(): Promise<Record<string, SystemAgent>>;
  };
  catalog: {
    getAll(): Promise<Record<string, SystemAgent>>;
    get(key: string): Promise<SystemAgent | undefined>;
    create(key: string, entry: SystemAgent): Promise<void>;
    update(key: string, entry: Partial<SystemAgent>): Promise<void>;
    delete(key: string): Promise<void>;
  };
  categories: {
    getAll(): Promise<
      Record<string, { description?: string; [key: string]: unknown }>
    >;
    get(
      key: string,
    ): Promise<{ description?: string; [key: string]: unknown } | undefined>;
    create(
      key: string,
      entry: { description?: string; [key: string]: unknown },
    ): Promise<void>;
    update(
      key: string,
      entry: Partial<{ description?: string; [key: string]: unknown }>,
    ): Promise<void>;
    delete(key: string): Promise<void>;
  };
  routing: {
    getPluginConfig(
      pluginId: string,
    ): Promise<PluginRoutingInput | null | undefined>;
    getAgentMappings(pluginId: string): Promise<Record<string, string>>;
    getCategoryMappings(pluginId: string): Promise<Record<string, boolean>>;
    toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
    toggleCategoryMapping(
      pluginId: string,
      categoryId: string,
    ): Promise<boolean>;
    savePluginConfig(
      pluginId: string,
      config: PluginRoutingInput,
    ): Promise<void>;
  };
}

// Repository interface for plugin config
export interface AgentRepository {
  read(): Promise<{
    plugins?: Record<string, PluginRoutingInput>;
    agents?: Record<string, SystemAgent>;
    [key: string]: unknown;
  }>;
  write(config: {
    plugins?: Record<string, PluginRoutingInput>;
    agents?: Record<string, SystemAgent>;
    [key: string]: unknown;
  }): Promise<void>;
}

// Result type combining services + registry + repository
export interface AgentPluginsOrchestrator {
  services: AgentServices;
  registry: PluginRegistry;
  repository: AgentRepository;
}

// Factory options
export interface AgentPluginsOrchestratorOptions {
  repository: IAgentsRepository;
  modelsRepository?: IModelsRepository;
  services: AgentServices;
  outputDir?: string;
  allPlugins: IPlugin[];
}

/**
 * Creates an orchestrator that combines agents-manager services with plugin registry.
 * This factory is used by server-core to wire together:
 * - Services from @lite-llm/agents-manager (for routing/config management)
 * - Registry from @lite-llm/agent-plugins (for config file generation)
 */
export async function createAgentPluginsOrchestrator(
  options: AgentPluginsOrchestratorOptions,
): Promise<AgentPluginsOrchestrator> {
  const registry = new PluginRegistry({
    repository: options.repository,
    modelsRepository: options.modelsRepository,
    outputDir: options.outputDir,
    allPlugins: options.allPlugins,
  });

  const config = await options.repository.read();
  const pluginConfigs = (config.plugins ?? {}) as Record<
    string,
    PluginRoutingInput
  >;
  registry.loadFromConfig(pluginConfigs);

  // Wrap repository to expose only what's needed for plugin config
  const wrappedRepository: AgentRepository = {
    read: () =>
      options.repository.read() as Promise<{
        plugins?: Record<string, PluginRoutingInput>;
        agents?: Record<string, SystemAgent>;
        [key: string]: unknown;
      }>,
    write: (config) =>
      options.repository.write(
        config as Parameters<typeof options.repository.write>[0],
      ),
  };

  return {
    services: options.services,
    registry,
    repository: wrappedRepository,
  };
}
