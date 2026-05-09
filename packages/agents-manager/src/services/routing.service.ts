import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig } from "@lite-llm/agents-repository/schema";
import type { PluginRoutingConfig } from "../types/routing.js";

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
}

export class RoutingService implements IRoutingService {
  private readonly repository: IAgentsRepository;

  constructor(options: RoutingServiceOptions) {
    this.repository = options.repository;
  }

  async getConfig(): Promise<PluginRoutingConfig> {
    const config = (await this.repository.read()) as DbConfig;
    return (config.routing ?? {
      version: 1,
      plugins: {},
    }) as unknown as PluginRoutingConfig;
  }

  async saveConfig(routing: PluginRoutingConfig): Promise<void> {
    const config = (await this.repository.read()) as DbConfig;
    const existingSyncAliases = config.routing
      ? (config.routing as Record<string, unknown>).syncAliases
      : undefined;
    config.routing = routing;
    if (existingSyncAliases !== undefined) {
      (config.routing as Record<string, unknown>).syncAliases =
        existingSyncAliases;
    }
    await this.repository.write(config as DbConfig);
  }

  async getRoutingForAgent(agentId: string): Promise<string[]> {
    const routing = await this.getConfig();
    const enabled: string[] = [];

    for (const [pluginId, plugin] of Object.entries(routing.plugins)) {
      const rule = plugin.agents[agentId];
      if (rule?.enabled) {
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

    // Disable the agent in all plugins first
    for (const plugin of Object.values(routing.plugins)) {
      if (plugin.agents[agentId]) {
        plugin.agents[agentId].enabled = false;
      }
    }

    // Enable only the specified plugins
    for (const pluginId of pluginIds) {
      if (!routing.plugins[pluginId]) {
        routing.plugins[pluginId] = {
          enabled: true,
          outputFile: "",
          agents: {},
        };
      }

      routing.plugins[pluginId].agents[agentId] = {
        ...routing.plugins[pluginId].agents[agentId],
        enabled: true,
      };
    }

    await this.saveConfig(routing);
  }

  async toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean> {
    const routing = await this.getConfig();

    if (!routing.plugins[pluginId]) {
      routing.plugins[pluginId] = {
        enabled: true,
        outputFile: "",
        agents: {},
      };
    }

    const current = routing.plugins[pluginId].agents[agentId];
    const newEnabled = !current?.enabled;

    routing.plugins[pluginId].agents[agentId] = {
      ...current,
      enabled: newEnabled,
    };

    await this.saveConfig(routing);
    return newEnabled;
  }

  async isPluginEnabled(pluginId: string, agentId: string): Promise<boolean> {
    const routing = await this.getConfig();
    return routing.plugins[pluginId]?.agents[agentId]?.enabled ?? false;
  }

  async getSyncAliases(): Promise<boolean> {
    const config = (await this.repository.read()) as DbConfig;
    if (!config.routing) return false;
    return (config.routing as Record<string, unknown>).syncAliases === true;
  }

  async setSyncAliases(enabled: boolean): Promise<void> {
    const config = (await this.repository.read()) as DbConfig;
    if (!config.routing) {
      config.routing = { version: 1, plugins: {} };
    }
    (config.routing as Record<string, unknown>).syncAliases = enabled;
    await this.repository.write(config as DbConfig);
  }
}
