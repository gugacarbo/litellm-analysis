import { readFileSync } from "node:fs";
import {
  normalizeConfig,
  parseConfigContent,
} from "@lite-llm/repository-utils/jsonc";
import { type ModelsConfig, modelsConfigSchema } from "./schemas/index.js";
import { FileStorage, type IStorage } from "./storage.js";

export type {
  Cost,
  ModelSpec,
  ModelsConfig,
  Provider,
} from "./schemas/index.js";

export interface RepositoryOptions {
  filePath: string;
  storage?: IStorage;
  validateOnRead?: boolean;
}

export interface IModelsRepository {
  read(): Promise<ModelsConfig>;
  readSync(): ModelsConfig;
  write(config: ModelsConfig): Promise<void>;
  validate(config: unknown): config is ModelsConfig;
  exists(): Promise<boolean>;
  getPath(): string;
}

export class ModelsRepository implements IModelsRepository {
  private readonly filePath: string;
  private readonly storage: IStorage;
  private readonly validateOnRead: boolean;

  constructor(options: RepositoryOptions) {
    this.filePath = options.filePath;
    this.storage = options.storage ?? new FileStorage();
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<ModelsConfig> {
    const content = await this.storage.read(this.filePath);
    const parsed = normalizeConfig(parseConfigContent(content, this.filePath));

    if (this.validateOnRead) {
      const result = modelsConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid config at ${this.filePath}: ${result.error.message}`,
        );
      }
      return result.data;
    }

    return parsed as ModelsConfig;
  }

  readSync(): ModelsConfig {
    const content = readFileSync(this.filePath, "utf-8");
    const parsed = normalizeConfig(parseConfigContent(content, this.filePath));

    if (this.validateOnRead) {
      const result = modelsConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid config at ${this.filePath}: ${result.error.message}`,
        );
      }
      return result.data;
    }

    return parsed as ModelsConfig;
  }

  async write(config: ModelsConfig): Promise<void> {
    const normalizedConfig = normalizeConfig(config);
    const result = modelsConfigSchema.safeParse(normalizedConfig);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    const content = JSON.stringify(result.data, null, 2);
    await this.storage.write(this.filePath, content);
  }

  validate(config: unknown): config is ModelsConfig {
    const result = modelsConfigSchema.safeParse(config);
    return result.success;
  }

  async exists(): Promise<boolean> {
    return this.storage.exists(this.filePath);
  }

  getPath(): string {
    return this.filePath;
  }
}

export function createRepository(
  options: RepositoryOptions,
): IModelsRepository {
  return new ModelsRepository(options);
}
