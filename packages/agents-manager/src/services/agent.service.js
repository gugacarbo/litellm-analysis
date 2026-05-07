export class AgentService {
  repository;
  constructor(options) {
    this.repository = options.repository;
  }
  async getAll() {
    const config = await this.repository.read();
    return config.agents;
  }
  async get(key) {
    const config = await this.repository.read();
    return config.agents[key];
  }
  async create(key, entry) {
    const config = await this.repository.read();
    if (config.agents[key] !== undefined) {
      throw new Error(`Agent "${key}" already exists`);
    }
    config.agents[key] = entry;
    await this.repository.write(config);
  }
  async update(key, entry) {
    const config = await this.repository.read();
    if (config.agents[key] === undefined) {
      throw new Error(`Agent "${key}" not found`);
    }
    config.agents[key] = { ...config.agents[key], ...entry };
    await this.repository.write(config);
  }
  async upsert(key, entry) {
    const config = await this.repository.read();
    config.agents[key] = entry;
    await this.repository.write(config);
  }
  async delete(key) {
    const config = await this.repository.read();
    if (config.agents[key] === undefined) {
      throw new Error(`Agent "${key}" not found`);
    }
    delete config.agents[key];
    await this.repository.write(config);
  }
}
