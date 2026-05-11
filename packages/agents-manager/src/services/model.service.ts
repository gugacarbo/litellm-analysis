import type {
  IAgentsRepository,
  ModelSpec,
} from "@lite-llm/agents-repository/repository";

export interface ModelServiceOptions {
  repository: IAgentsRepository;
}

export interface IModelService {
  getAll(): Promise<Record<string, ModelSpec>>;
  get(key: string): Promise<ModelSpec | undefined>;
  create(key: string, spec: ModelSpec): Promise<void>;
  update(key: string, spec: Partial<ModelSpec>): Promise<void>;
  upsert(key: string, spec: ModelSpec): Promise<void>;
  delete(key: string): Promise<void>;
  resolveModelName(key: string): Promise<string>;
}

export class ModelService implements IModelService {
  private readonly repository: IAgentsRepository;

  constructor(options: ModelServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, ModelSpec>> {
    const config = await this.repository.read();
    return config.models;
  }

  async get(key: string): Promise<ModelSpec | undefined> {
    const config = await this.repository.read();
    return config.models[key];
  }

  async create(key: string, spec: ModelSpec): Promise<void> {
    const config = await this.repository.read();

    if (config.models[key] !== undefined) {
      throw new Error(`Model "${key}" already exists`);
    }

    config.models[key] = spec;
    await this.repository.write(config);
  }

  async update(key: string, spec: Partial<ModelSpec>): Promise<void> {
    const config = await this.repository.read();

    if (config.models[key] === undefined) {
      throw new Error(`Model "${key}" not found`);
    }

    config.models[key] = { ...config.models[key], ...spec };
    await this.repository.write(config);
  }

  async upsert(key: string, spec: ModelSpec): Promise<void> {
    const config = await this.repository.read();
    config.models[key] = spec;
    await this.repository.write(config);
  }

  async delete(key: string): Promise<void> {
    const config = await this.repository.read();

    if (config.models[key] === undefined) {
      throw new Error(`Model "${key}" not found`);
    }

    delete config.models[key];
    await this.repository.write(config);
  }

  async resolveModelName(key: string): Promise<string> {
    const config = await this.repository.read();

    // Check if it's a direct model
    if (config.models[key] !== undefined) {
      return key;
    }

    // Return as-is if not found (might be an alias)
    return key;
  }
}
