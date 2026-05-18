import type {
  IModelsRepository,
  ModelSpec,
} from "@lite-llm/models-repository/repository";

export interface ModelServiceOptions {
  repository: IModelsRepository;
}

export interface IModelService {
  getAll(): Promise<Record<string, ModelSpec>>;
  get(key: string): Promise<ModelSpec | undefined>;
  getEnabledModelNames(): Promise<Set<string>>;
  create(key: string, spec: ModelSpec): Promise<void>;
  update(key: string, spec: Partial<ModelSpec>): Promise<void>;
  upsert(key: string, spec: ModelSpec): Promise<void>;
  delete(key: string): Promise<void>;
}

export class ModelService implements IModelService {
  private readonly repository: IModelsRepository;

  constructor(options: ModelServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, ModelSpec>> {
    const config = await this.repository.read();
    return config.models;
  }

  async getEnabledModelNames(): Promise<Set<string>> {
    const config = await this.repository.read();
    return new Set(
      Object.entries(config.models)
        .filter(([, spec]) => spec.enabled !== false)
        .map(([name]) => name),
    );
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
}
