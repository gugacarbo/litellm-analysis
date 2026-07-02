import type {
  IModelsRepository,
  Provider,
} from "@lite-llm/models-repository";

export interface ProviderServiceOptions {
  repository: IModelsRepository;
}

export interface IProviderService {
  getAll(): Promise<Record<string, Provider>>;
  get(key: string): Promise<Provider | undefined>;
  create(key: string, spec: Provider): Promise<void>;
  update(key: string, spec: Partial<Provider>): Promise<void>;
  upsert(key: string, spec: Provider): Promise<void>;
  delete(key: string): Promise<void>;
}

export class ProviderService implements IProviderService {
  private readonly repository: IModelsRepository;

  constructor(options: ProviderServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, Provider>> {
    const config = await this.repository.read();
    return config.provider;
  }

  async get(key: string): Promise<Provider | undefined> {
    const config = await this.repository.read();
    return config.provider[key];
  }

  async create(key: string, spec: Provider): Promise<void> {
    const config = await this.repository.read();
    if (config.provider[key] !== undefined) {
      throw new Error(`Provider "${key}" already exists`);
    }
    config.provider[key] = spec;
    await this.repository.write(config);
  }

  async update(key: string, spec: Partial<Provider>): Promise<void> {
    const config = await this.repository.read();
    if (config.provider[key] === undefined) {
      throw new Error(`Provider "${key}" not found`);
    }
    config.provider[key] = { ...config.provider[key], ...spec };
    await this.repository.write(config);
  }

  async upsert(key: string, spec: Provider): Promise<void> {
    const config = await this.repository.read();
    config.provider[key] = spec;
    await this.repository.write(config);
  }

  async delete(key: string): Promise<void> {
    const config = await this.repository.read();
    if (config.provider[key] === undefined) {
      throw new Error(`Provider "${key}" not found`);
    }
    delete config.provider[key];
    await this.repository.write(config);
  }
}
