import type {
  CategoryEntry,
  IDbRepository,
} from "@lite-llm/db-repository/repository";

export interface CategoryServiceOptions {
  repository: IDbRepository;
}

export interface ICategoryService {
  getAll(): Promise<Record<string, CategoryEntry>>;
  get(key: string): Promise<CategoryEntry | undefined>;
  create(key: string, entry: CategoryEntry): Promise<void>;
  update(key: string, entry: Partial<CategoryEntry>): Promise<void>;
  upsert(key: string, entry: CategoryEntry): Promise<void>;
  delete(key: string): Promise<void>;
}

export class CategoryService implements ICategoryService {
  private readonly repository: IDbRepository;

  constructor(options: CategoryServiceOptions) {
    this.repository = options.repository;
  }

  async getAll(): Promise<Record<string, CategoryEntry>> {
    const config = await this.repository.read();
    return config.categories;
  }

  async get(key: string): Promise<CategoryEntry | undefined> {
    const config = await this.repository.read();
    return config.categories[key];
  }

  async create(key: string, entry: CategoryEntry): Promise<void> {
    const config = await this.repository.read();

    if (config.categories[key] !== undefined) {
      throw new Error(`Category "${key}" already exists`);
    }

    config.categories[key] = entry;
    await this.repository.write(config);
  }

  async update(key: string, entry: Partial<CategoryEntry>): Promise<void> {
    const config = await this.repository.read();

    if (config.categories[key] === undefined) {
      throw new Error(`Category "${key}" not found`);
    }

    config.categories[key] = { ...config.categories[key], ...entry };
    await this.repository.write(config);
  }

  async upsert(key: string, entry: CategoryEntry): Promise<void> {
    const config = await this.repository.read();
    config.categories[key] = entry;
    await this.repository.write(config);
  }

  async delete(key: string): Promise<void> {
    const config = await this.repository.read();

    if (config.categories[key] === undefined) {
      throw new Error(`Category "${key}" not found`);
    }

    delete config.categories[key];
    await this.repository.write(config);
  }
}
