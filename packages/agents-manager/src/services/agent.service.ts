import type {
  AgentEntry,
  IDbRepository,
} from "@lite-llm/db-repository/repository";

export interface AgentServiceOptions {
  repository: IDbRepository;
}

export interface IAgentService {
  getAll(): Promise<Record<string, AgentEntry>>;
  get(key: string): Promise<AgentEntry | undefined>;
  create(key: string, entry: AgentEntry): Promise<void>;
  update(key: string, entry: Partial<AgentEntry>): Promise<void>;
  upsert(key: string, entry: AgentEntry): Promise<void>;
  delete(key: string): Promise<void>;
}

export class AgentService implements IAgentService {
  private readonly repository: IDbRepository;

  constructor(options: AgentServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, AgentEntry>> {
    const config = await this.repository.read();
    return config.agents;
  }

  async get(key: string): Promise<AgentEntry | undefined> {
    const config = await this.repository.read();
    return config.agents[key];
  }

  async create(key: string, entry: AgentEntry): Promise<void> {
    const config = await this.repository.read();

    if (config.agents[key] !== undefined) {
      throw new Error(`Agent "${key}" already exists`);
    }

    config.agents[key] = entry;
    await this.repository.write(config);
  }

  async update(key: string, entry: Partial<AgentEntry>): Promise<void> {
    const config = await this.repository.read();

    if (config.agents[key] === undefined) {
      throw new Error(`Agent "${key}" not found`);
    }

    config.agents[key] = { ...config.agents[key], ...entry };
    await this.repository.write(config);
  }

  async upsert(key: string, entry: AgentEntry): Promise<void> {
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
