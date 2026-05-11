import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { SystemAgent } from "@lite-llm/agents-repository/schema";

export interface AgentServiceOptions {
  repository: IAgentsRepository;
}

export interface IAgentService {
  getAll(): Promise<Record<string, SystemAgent>>;
  get(key: string): Promise<SystemAgent | undefined>;
  create(key: string, entry: SystemAgent): Promise<void>;
  update(key: string, entry: Partial<SystemAgent>): Promise<void>;
  upsert(key: string, entry: SystemAgent): Promise<void>;
  delete(key: string): Promise<void>;
}

export class AgentService implements IAgentService {
  private readonly repository: IAgentsRepository;

  constructor(options: AgentServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, SystemAgent>> {
    const config = await this.repository.read();
    return config.agents;
  }

  async get(key: string): Promise<SystemAgent | undefined> {
    const config = await this.repository.read();
    return config.agents[key];
  }

  async create(key: string, entry: SystemAgent): Promise<void> {
    const config = await this.repository.read();

    if (config.agents[key] !== undefined) {
      throw new Error(`Agent "${key}" already exists`);
    }

    config.agents[key] = entry;
    await this.repository.write(config);
  }

  async update(key: string, entry: Partial<SystemAgent>): Promise<void> {
    const config = await this.repository.read();

    if (config.agents[key] === undefined) {
      throw new Error(`Agent "${key}" not found`);
    }

    config.agents[key] = { ...config.agents[key], ...entry };
    await this.repository.write(config);
  }

  async upsert(key: string, entry: SystemAgent): Promise<void> {
    const config = await this.repository.read();
    config.agents[key] = entry;
    await this.repository.write(config);
  }

  async delete(key: string): Promise<void> {
    const config = await this.repository.read();

    if (config.agents[key] === undefined) {
      throw new Error(`Agent "${key}" not found`);
    }

    delete config.agents[key];
    await this.repository.write(config);
  }
}
