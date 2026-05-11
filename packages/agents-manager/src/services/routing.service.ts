import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { PluginRoutingConfig } from "@lite-llm/agents-repository/schema";

export interface RoutingServiceOptions {
  repository: IAgentsRepository;
}

export interface IRoutingService {
  getConfig(): Promise<PluginRoutingConfig>;
  saveConfig(config: PluginRoutingConfig): Promise<void>;
  getRoutingForAgent(agentId: string): Promise<string[]>;
  setRoutingForAgent(agentId: string, pluginIds: string[]): Promise<void>;
  toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
  isPluginEnabled(pluginId: string, agentId: string): Promise<boolean>;
  getSyncAliases(): Promise<boolean>;
  setSyncAliases(enabled: boolean): Promise<void>;
  getPluginConfig(pluginId: string): Promise<Record<string, unknown>>;
  savePluginConfig(
    pluginId: string,
    config: Record<string, unknown>,
  ): Promise<void>;
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

export class RoutingService implements IRoutingService {
  private readonly repository: IAgentsRepository;

  constructor(options: RoutingServiceOptions) {
    this.repository = options.repository;
  }

  async getConfig(): Promise<PluginRoutingConfig> {
    const config = await this.repository.read();
    return config.routing ?? { version: 1, plugins: {} };
  }

  async saveConfig(routing: PluginRoutingConfig): Promise<void> {
    const config = await this.repository.read();
    const existingSyncAliases = config.routing
      ? (config.routing as unknown as Record<string, unknown>).syncAliases
      : undefined;
    config.routing = routing;
    if (existingSyncAliases !== undefined) {
      (config.routing as unknown as Record<string, unknown>).syncAliases =
        existingSyncAliases;
    }
    await this.repository.write(config);
  }

  async getRoutingForAgent(agentId: string): Promise<string[]> {
    const routing = await this.getConfig();
    const enabled: string[] = [];

    for (const [pluginId, plugin] of Object.entries(routing.plugins)) {
      const mapped = plugin.routing?.agents?.[agentId];
      if (mapped) {
        enabled.push(pluginId);
      }
    }

    return enabled;
  }

  async setRoutingForAgent(
    agentId: string,
    pluginIds: string[],
  ): Promise<void> {
    const routing = await this.getConfig();

    for (const plugin of Object.values(routing.plugins)) {
      if (plugin.routing?.agents?.[agentId]) {
        delete plugin.routing.agents[agentId];
      }
    }

    for (const pluginId of pluginIds) {
      if (!routing.plugins[pluginId]) {
        routing.plugins[pluginId] = {
          enabled: true,
          outputFile: "",
          routing: { agents: {}, categories: {} },
        };
      }

      if (!routing.plugins[pluginId].routing) {
        routing.plugins[pluginId].routing = { agents: {}, categories: {} };
      }
      if (!routing.plugins[pluginId].routing.agents) {
        routing.plugins[pluginId].routing.agents = {};
      }

      // Default route keeps the same id for plugin-side agent when not specified.
      routing.plugins[pluginId].routing.agents[agentId] = agentId;
    }

    await this.saveConfig(routing);
  }

  async toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean> {
    const routing = await this.getConfig();

    if (!routing.plugins[pluginId]) {
      routing.plugins[pluginId] = {
        enabled: true,
        outputFile: "",
        routing: { agents: {}, categories: {} },
      };
    }

    if (!routing.plugins[pluginId].routing) {
      routing.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    if (!routing.plugins[pluginId].routing.agents) {
      routing.plugins[pluginId].routing.agents = {};
    }
    const current = routing.plugins[pluginId].routing.agents[agentId];
    const newEnabled = !current;
    if (newEnabled) {
      routing.plugins[pluginId].routing.agents[agentId] = agentId;
    } else {
      delete routing.plugins[pluginId].routing.agents[agentId];
    }

    await this.saveConfig(routing);
    return newEnabled;
  }

  async isPluginEnabled(pluginId: string, agentId: string): Promise<boolean> {
    const routing = await this.getConfig();
    return Boolean(routing.plugins[pluginId]?.routing?.agents?.[agentId]);
  }

  async getSyncAliases(): Promise<boolean> {
    const config = await this.repository.read();
    const routing = config.routing;
    if (!routing) return false;
    return (routing as unknown as Record<string, unknown>).syncAliases === true;
  }

  async setSyncAliases(enabled: boolean): Promise<void> {
    const config = await this.repository.read();
    if (!config.routing) {
      config.routing = { version: 1, plugins: {} };
    }
    (config.routing as unknown as Record<string, unknown>).syncAliases =
      enabled;
    await this.repository.write(config);
  }

  async getPluginConfig(pluginId: string): Promise<Record<string, unknown>> {
    const config = await this.getConfig();
    return (config.plugins[pluginId]?.config as Record<string, unknown>) ?? {};
  }

  async savePluginConfig(
    pluginId: string,
    config: Record<string, unknown>,
  ): Promise<void> {
    const routing = await this.getConfig();
    if (!routing.plugins[pluginId]) {
      routing.plugins[pluginId] = {
        enabled: true,
        outputFile: "",
        routing: { agents: {}, categories: {} },
      };
    }
    routing.plugins[pluginId].config = config;
    await this.saveConfig(routing);
  }

  async getAgentMappings(pluginId: string): Promise<Record<string, string>> {
    const config = await this.getConfig();
    return (config.plugins[pluginId]?.routing?.agents ?? {}) as Record<
      string,
      string
    >;
  }

  async saveAgentMappings(
    pluginId: string,
    mappings: Record<string, string>,
  ): Promise<void> {
    const routing = await this.getConfig();
    if (!routing.plugins[pluginId]) {
      routing.plugins[pluginId] = {
        enabled: true,
        outputFile: "",
        routing: { agents: {}, categories: {} },
      };
    }
    if (!routing.plugins[pluginId].routing) {
      routing.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    routing.plugins[pluginId].routing.agents = mappings;
    await this.saveConfig(routing);
  }

  async getCategoryMappings(
    pluginId: string,
  ): Promise<Record<string, boolean>> {
    const config = await this.getConfig();
    return (config.plugins[pluginId]?.routing?.categories ?? {}) as Record<
      string,
      boolean
    >;
  }

  async saveCategoryMappings(
    pluginId: string,
    mappings: Record<string, boolean>,
  ): Promise<void> {
    const routing = await this.getConfig();
    if (!routing.plugins[pluginId]) {
      routing.plugins[pluginId] = {
        enabled: true,
        outputFile: "",
        routing: { agents: {}, categories: {} },
      };
    }
    if (!routing.plugins[pluginId].routing) {
      routing.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    routing.plugins[pluginId].routing.categories = mappings;
    await this.saveConfig(routing);
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
