import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig } from "@lite-llm/agents-repository/schema";
import type { PluginRoutingConfig, SystemAgent } from "../types/index.js";

interface ExtendedConfig extends DbConfig {
  systemAgents?: Record<string, SystemAgent>;
  routing?: PluginRoutingConfig;
}

export interface AgentCatalogServiceOptions {
  repository: IAgentsRepository;
}

export interface IAgentCatalogService {
  getAll(): Promise<Record<string, SystemAgent>>;
  get(key: string): Promise<SystemAgent | undefined>;
  create(key: string, entry: SystemAgent): Promise<void>;
  update(key: string, entry: Partial<SystemAgent>): Promise<void>;
  upsert(key: string, entry: SystemAgent): Promise<void>;
  delete(key: string): Promise<void>;
}

export class AgentCatalogService implements IAgentCatalogService {
  private readonly repository: IAgentsRepository;

  constructor(options: AgentCatalogServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, SystemAgent>> {
    const config = await this.readWithSystemAgents();
    return config.systemAgents ?? {};
  }

  async get(key: string): Promise<SystemAgent | undefined> {
    const config = await this.readWithSystemAgents();
    return config.systemAgents?.[key];
  }

  async create(key: string, entry: SystemAgent): Promise<void> {
    const config = await this.readWithSystemAgents();

    if (config.systemAgents?.[key] !== undefined) {
      throw new Error(`SystemAgent "${key}" already exists`);
    }

    if (config.systemAgents === undefined) {
      config.systemAgents = {};
    }

    config.systemAgents[key] = entry;
    await this.repository.write(config);
  }

  async update(key: string, entry: Partial<SystemAgent>): Promise<void> {
    const config = await this.readWithSystemAgents();

    if (config.systemAgents?.[key] === undefined) {
      throw new Error(`SystemAgent "${key}" not found`);
    }

    config.systemAgents[key] = { ...config.systemAgents[key], ...entry };
    await this.repository.write(config);
  }

  async upsert(key: string, entry: SystemAgent): Promise<void> {
    const config = await this.readWithSystemAgents();

    if (config.systemAgents === undefined) {
      config.systemAgents = {};
    }

    config.systemAgents[key] = entry;
    await this.repository.write(config);
  }

  async delete(key: string): Promise<void> {
    const config = await this.readWithSystemAgents();

    if (config.systemAgents?.[key] === undefined) {
      throw new Error(`SystemAgent "${key}" not found`);
    }

    delete config.systemAgents[key];
    await this.repository.write(config);
  }

  private async readWithSystemAgents(): Promise<ExtendedConfig> {
    const config = await this.repository.read();
    return config as ExtendedConfig;
  }
}
