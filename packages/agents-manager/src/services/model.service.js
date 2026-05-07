export class ModelService {
  repository;
  constructor(options) {
    this.repository = options.repository;
  }
  async getAll() {
    const config = await this.repository.read();
    return config.models;
  }
  async get(key) {
    const config = await this.repository.read();
    return config.models[key];
  }
  async create(key, spec) {
    const config = await this.repository.read();
    if (config.models[key] !== undefined) {
      throw new Error(`Model "${key}" already exists`);
    }
    config.models[key] = spec;
    await this.repository.write(config);
  }
  async update(key, spec) {
    const config = await this.repository.read();
    if (config.models[key] === undefined) {
      throw new Error(`Model "${key}" not found`);
    }
    config.models[key] = { ...config.models[key], ...spec };
    await this.repository.write(config);
  }
  async upsert(key, spec) {
    const config = await this.repository.read();
    config.models[key] = spec;
    await this.repository.write(config);
  }
  async delete(key) {
    const config = await this.repository.read();
    if (config.models[key] === undefined) {
      throw new Error(`Model "${key}" not found`);
    }
    delete config.models[key];
    await this.repository.write(config);
  }
  async resolveModelName(key) {
    const config = await this.repository.read();
    // Check custom aliases first
    if (config.customAliases?.[key]) {
      return config.customAliases[key];
    }
    // Check if it's a direct model
    if (config.models[key] !== undefined) {
      return key;
    }
    // Return as-is if not found (might be an alias)
    return key;
  }
}
