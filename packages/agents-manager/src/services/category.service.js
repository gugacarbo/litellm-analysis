export class CategoryService {
  repository;
  constructor(options) {
    this.repository = options.repository;
  }
  async getAll() {
    const config = await this.repository.read();
    return config.categories;
  }
  async get(key) {
    const config = await this.repository.read();
    return config.categories[key];
  }
  async create(key, entry) {
    const config = await this.repository.read();
    if (config.categories[key] !== undefined) {
      throw new Error(`Category "${key}" already exists`);
    }
    config.categories[key] = entry;
    await this.repository.write(config);
  }
  async update(key, entry) {
    const config = await this.repository.read();
    if (config.categories[key] === undefined) {
      throw new Error(`Category "${key}" not found`);
    }
    config.categories[key] = { ...config.categories[key], ...entry };
    await this.repository.write(config);
  }
  async upsert(key, entry) {
    const config = await this.repository.read();
    config.categories[key] = entry;
    await this.repository.write(config);
  }
  async delete(key) {
    const config = await this.repository.read();
    if (config.categories[key] === undefined) {
      throw new Error(`Category "${key}" not found`);
    }
    delete config.categories[key];
    await this.repository.write(config);
  }
}
