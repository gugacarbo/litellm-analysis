import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { PluginRouting } from "@lite-llm/agents-repository/schemas";

export interface RoutingServiceOptions {
  repository: IAgentsRepository;
}

export interface IRoutingService {
  getPluginsForAgent(agentId: string): Promise<string[]>;
  setPluginsForAgent(agentId: string, pluginIds: string[]): Promise<void>;
  toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
  isPluginEnabled(pluginId: string, agentId: string): Promise<boolean>;
  getPluginConfig(pluginId: string): Promise<PluginRouting | undefined>;
  savePluginConfig(pluginId: string, config: PluginRouting): Promise<void>;
  getAgentMappings(pluginId: string): Promise<Record<string, string>>;
  saveAgentMappings(
    pluginId: string,
    mappings: Record<string, string>,
  ): Promise<void>;
  getCategoryMappings(pluginId: string): Promise<Record<string, boolean>>;
  saveCategoryMappings(
    pluginId: string,
    mappings: Record<string, boolean>,
  ): Promise<void>;
  toggleCategoryMapping(pluginId: string, categoryId: string): Promise<boolean>;
}

const DEFAULT_PLUGIN_ROUTING = (outputFile = ""): PluginRouting => ({
  enabled: true,
  outputFile,
  routing: { agents: {}, categories: {} },
});

export class RoutingService implements IRoutingService {
  private readonly repository: IAgentsRepository;

  constructor(options: RoutingServiceOptions) {
    this.repository = options.repository;
  }

  async getPluginsForAgent(agentId: string): Promise<string[]> {
    const config = await this.repository.read();
    const enabled: string[] = [];
    for (const [pluginId, plugin] of Object.entries(config.plugins ?? {})) {
      if (plugin.routing?.agents?.[agentId]) {
        enabled.push(pluginId);
      }
    }
    return enabled;
  }

  async setPluginsForAgent(
    agentId: string,
    pluginIds: string[],
  ): Promise<void> {
    const config = await this.repository.read();

    // Remove agent from all plugins
    for (const plugin of Object.values(config.plugins ?? {})) {
      if (plugin.routing?.agents?.[agentId]) {
        delete plugin.routing.agents[agentId];
      }
    }

    // Add agent to specified plugins
    for (const pluginId of pluginIds) {
      if (!config.plugins) {
        config.plugins = {};
      }
      if (!config.plugins[pluginId]) {
        config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
      }
      if (!config.plugins[pluginId].routing) {
        config.plugins[pluginId].routing = { agents: {}, categories: {} };
      }
      if (!config.plugins[pluginId].routing.agents) {
        config.plugins[pluginId].routing.agents = {};
      }
      config.plugins[pluginId].routing.agents[agentId] = agentId;
    }

    await this.repository.write(config);
  }

  async toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean> {
    const config = await this.repository.read();

    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins[pluginId]) {
      config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
    }
    if (!config.plugins[pluginId].routing) {
      config.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    if (!config.plugins[pluginId].routing.agents) {
      config.plugins[pluginId].routing.agents = {};
    }

    const current = config.plugins[pluginId].routing.agents[agentId];
    const newEnabled = !current;
    if (newEnabled) {
      config.plugins[pluginId].routing.agents[agentId] = agentId;
    } else {
      delete config.plugins[pluginId].routing.agents[agentId];
    }

    await this.repository.write(config);
    return newEnabled;
  }

  async isPluginEnabled(pluginId: string, agentId: string): Promise<boolean> {
    const config = await this.repository.read();
    return Boolean(config.plugins?.[pluginId]?.routing?.agents?.[agentId]);
  }

  async getPluginConfig(pluginId: string): Promise<PluginRouting | undefined> {
    const config = await this.repository.read();
    return config.plugins?.[pluginId];
  }

  async savePluginConfig(
    pluginId: string,
    pluginConfig: PluginRouting,
  ): Promise<void> {
    const config = await this.repository.read();
    if (!config.plugins) {
      config.plugins = {};
    }
    config.plugins[pluginId] = pluginConfig;
    await this.repository.write(config);
  }

  async getAgentMappings(pluginId: string): Promise<Record<string, string>> {
    const config = await this.repository.read();
    return config.plugins?.[pluginId]?.routing?.agents ?? {};
  }

  async saveAgentMappings(
    pluginId: string,
    mappings: Record<string, string>,
  ): Promise<void> {
    const config = await this.repository.read();
    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins[pluginId]) {
      config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
    }
    if (!config.plugins[pluginId].routing) {
      config.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    config.plugins[pluginId].routing.agents = mappings;
    await this.repository.write(config);
  }

  async getCategoryMappings(
    pluginId: string,
  ): Promise<Record<string, boolean>> {
    const config = await this.repository.read();
    return config.plugins?.[pluginId]?.routing?.categories ?? {};
  }

  async saveCategoryMappings(
    pluginId: string,
    mappings: Record<string, boolean>,
  ): Promise<void> {
    const config = await this.repository.read();
    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins[pluginId]) {
      config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
    }
    if (!config.plugins[pluginId].routing) {
      config.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    config.plugins[pluginId].routing.categories = mappings;
    await this.repository.write(config);
  }

  async toggleCategoryMapping(
    pluginId: string,
    categoryId: string,
  ): Promise<boolean> {
    const mappings = await this.getCategoryMappings(pluginId);
    const newEnabled = !mappings[categoryId];
    mappings[categoryId] = newEnabled;
    await this.saveCategoryMappings(pluginId, mappings);
    return newEnabled;
  }
}
