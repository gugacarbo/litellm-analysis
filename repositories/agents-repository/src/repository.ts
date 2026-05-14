import { readFileSync } from "node:fs";
import {
  normalizeConfig,
  parseConfigContent,
} from "@lite-llm/repository-utils/jsonc";
import {
  type AgentsConfig,
  agentsConfigSchema,
} from "./schemas/index";
import { FileStorage, type IStorage } from "./storage";

// Re-export types for convenience
export type {
  AgentsConfig,
  AgentEntry,
  CategoryEntry,
  Cost,
  DbConfig,
  ModelSpec,
  Permission,
  ThinkingConfig,
} from "./schemas/index";

export interface RepositoryOptions {
  filePath: string;
  storage?: IStorage;
  validateOnRead?: boolean;
}

export interface IAgentsRepository {
  read(): Promise<AgentsConfig>;
  readSync(): AgentsConfig;
  write(config: AgentsConfig): Promise<void>;
  validate(config: unknown): config is AgentsConfig;
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

  async read(): Promise<AgentsConfig> {
    const content = await this.storage.read(this.filePath);
    const parsed = normalizeConfig(parseConfigContent(content, this.filePath));

    if (this.validateOnRead) {
      const result = agentsConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid config at ${this.filePath}: ${result.error.message}`,
        );
      }
      return result.data;
    }

    return parsed as AgentsConfig;
  }

  readSync(): AgentsConfig {
    const content = readFileSync(this.filePath, "utf-8");
    const parsed = normalizeConfig(parseConfigContent(content, this.filePath));

    if (this.validateOnRead) {
      const result = agentsConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid config at ${this.filePath}: ${result.error.message}`,
        );
      }
      return result.data;
    }

    return parsed as AgentsConfig;
  }

  async write(config: AgentsConfig): Promise<void> {
    const normalizedConfig = normalizeConfig(config);
    const result = agentsConfigSchema.safeParse(normalizedConfig);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    const content = JSON.stringify(result.data, null, 2);
    await this.storage.write(this.filePath, content);
  }

  validate(config: unknown): config is AgentsConfig {
    const result = agentsConfigSchema.safeParse(config);
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
