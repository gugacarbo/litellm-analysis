import { readFileSync } from "node:fs";
import { type DbConfig, dbConfigSchema } from "./schema.js";
import { FileStorage, type IStorage } from "./storage.js";

// Re-export types for convenience
export type {
  AgentEntry,
  CategoryEntry,
  Cost,
  DbConfig,
  ModelSpec,
  Permission,
  ThinkingConfig,
} from "./schema.js";

export interface RepositoryOptions {
  filePath: string;
  storage?: IStorage;
  validateOnRead?: boolean;
}

export interface IAgentsRepository {
  read(): Promise<DbConfig>;
  readSync(): DbConfig;
  write(config: DbConfig): Promise<void>;
  validate(config: unknown): config is DbConfig;
  exists(): Promise<boolean>;
  getPath(): string;
}

export class AgentsRepository implements IAgentsRepository {
  private readonly filePath: string;
  private readonly storage: IStorage;
  private readonly validateOnRead: boolean;

  constructor(options: RepositoryOptions) {
    this.filePath = options.filePath;
    this.storage = options.storage ?? new FileStorage();
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<DbConfig> {
    const content = await this.storage.read(this.filePath);
    const parsed = JSON.parse(content);

    if (this.validateOnRead) {
      const result = dbConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid agents.json: ${result.error.message}`);
      }
      return result.data;
    }

    return parsed as DbConfig;
  }

  readSync(): DbConfig {
    const content = readFileSync(this.filePath, "utf-8");
    const parsed = JSON.parse(content);

    if (this.validateOnRead) {
      const result = dbConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid agents.json: ${result.error.message}`);
      }
      return result.data;
    }

    return parsed as DbConfig;
  }

  async write(config: DbConfig): Promise<void> {
    const result = dbConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    const content = JSON.stringify(result.data, null, 2);
    await this.storage.write(this.filePath, content);
  }

  validate(config: unknown): config is DbConfig {
    const result = dbConfigSchema.safeParse(config);
    return result.success;
  }

  async exists(): Promise<boolean> {
    return this.storage.exists(this.filePath);
  }

  getPath(): string {
    return this.filePath;
  }
}

// ── Factory ──

export function createRepository(
  options: RepositoryOptions,
): IAgentsRepository {
  return new AgentsRepository(options);
}
