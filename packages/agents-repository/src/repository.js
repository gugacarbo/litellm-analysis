import { readFileSync } from "node:fs";
import { dbConfigSchema } from "./schema.js";
import { FileStorage } from "./storage.js";
export class AgentsRepository {
  filePath;
  storage;
  validateOnRead;
  constructor(options) {
    this.filePath = options.filePath;
    this.storage = options.storage ?? new FileStorage();
    this.validateOnRead = options.validateOnRead ?? true;
  }
  async read() {
    const content = await this.storage.read(this.filePath);
    const parsed = JSON.parse(content);
    if (this.validateOnRead) {
      const result = dbConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid agents.json: ${result.error.message}`);
      }
      return result.data;
    }
    return parsed;
  }
  readSync() {
    const content = readFileSync(this.filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (this.validateOnRead) {
      const result = dbConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid agents.json: ${result.error.message}`);
      }
      return result.data;
    }
    return parsed;
  }
  async write(config) {
    const result = dbConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }
    const content = JSON.stringify(result.data, null, 2);
    await this.storage.write(this.filePath, content);
  }
  validate(config) {
    const result = dbConfigSchema.safeParse(config);
    return result.success;
  }
  async exists() {
    return this.storage.exists(this.filePath);
  }
  getPath() {
    return this.filePath;
  }
}
// ── Factory ──
export function createRepository(options) {
  return new AgentsRepository(options);
}
