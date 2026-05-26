import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { SystemAgent } from "@lite-llm/agents-repository/schemas";
import type { IModelsRepository } from "@lite-llm/models-repository/repository";
import { ensurePluginSchemas } from "./lib/ensure-plugin-schemas";
import { createPluginCatalog } from "./plugin-catalog";
import {
  createPluginRegistry,
  type PluginConfigInput,
  type PluginRegistryV2,
} from "./plugin-registry";

export interface PluginRoutingInput extends PluginConfigInput {}

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

export interface AgentPluginsOrchestrator {
  services: AgentServices;
  registry: PluginRegistryV2;
  repository: AgentRepository;
}

export interface AgentPluginsOrchestratorOptions {
  repository: IAgentsRepository;
  modelsRepository?: IModelsRepository;
  services: AgentServices;
  outputDir?: string;
  aliasDbWriter?: {
    updateAliases(aliases: Record<string, string>): Promise<void>;
  };
}

export async function createAgentPluginsOrchestrator(
  options: AgentPluginsOrchestratorOptions,
): Promise<AgentPluginsOrchestrator> {
  await ensurePluginSchemas();

  const registry = createPluginRegistry({
    repository: options.repository,
    modelsRepository: options.modelsRepository,
    outputDir: options.outputDir,
    catalog: createPluginCatalog({ aliasDbWriter: options.aliasDbWriter }),
  });

  const config = await options.repository.read();
  const pluginConfigs = (config.plugins ?? {}) as Record<
    string,
    PluginRoutingInput
  >;
  registry.loadFromConfig(pluginConfigs);

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
