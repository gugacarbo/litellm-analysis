import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig, SystemAgent } from "@lite-llm/agents-repository/schema";

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
    const config = await this.readWithAgents();
    return config.agents ?? {};
  }

  async get(key: string): Promise<SystemAgent | undefined> {
    const config = await this.readWithAgents();
    return config.agents?.[key];
  }

  async create(key: string, entry: SystemAgent): Promise<void> {
    const config = await this.readWithAgents();

    if (config.agents?.[key] !== undefined) {
      throw new Error(`SystemAgent "${key}" already exists`);
    }

    if (config.agents === undefined) {
      config.agents = {};
    }

    config.agents[key] = entry;
    await this.repository.write(config);
  }

  async update(key: string, entry: Partial<SystemAgent>): Promise<void> {
    const config = await this.readWithAgents();

    if (config.agents?.[key] === undefined) {
      throw new Error(`SystemAgent "${key}" not found`);
    }

    config.agents[key] = { ...config.agents[key], ...entry };
    await this.repository.write(config);
  }

  async upsert(key: string, entry: SystemAgent): Promise<void> {
    const config = await this.readWithAgents();

    if (config.agents === undefined) {
      config.agents = {};
    }

    config.agents[key] = entry;
    await this.repository.write(config);
  }

  async delete(key: string): Promise<void> {
    const config = await this.readWithAgents();

    if (config.agents?.[key] === undefined) {
      throw new Error(`SystemAgent "${key}" not found`);
    }

    delete config.agents[key];
    await this.repository.write(config);
  }

  private async readWithAgents(): Promise<DbConfig> {
    const config = await this.repository.read();
    return config as DbConfig;
  }
}
