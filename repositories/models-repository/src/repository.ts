import { readFileSync } from "node:fs";
import * as path from "node:path";
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

function parseConfigContent(content: string, filePath: string): unknown {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".jsonc") {
      return JSON.parse(normalizeJsonc(content));
    }

    return JSON.parse(content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Failed to parse ${filePath}: ${message}`);
  }
}

function normalizeJsonc(input: string): string {
  const withoutComments = stripJsonComments(input);
  return removeTrailingCommas(withoutComments);
}

function stripJsonComments(input: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < input.length) {
    const current = input[i];
    const next = input[i + 1];

    if (inString) {
      out += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      out += current;
      i += 1;
      continue;
    }

    if (current === "/" && next === "/") {
      i += 2;
      while (i < input.length && input[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (current === "/" && next === "*") {
      i += 2;
      while (i < input.length - 1) {
        if (input[i] === "*" && input[i + 1] === "/") {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    out += current;
    i += 1;
  }

  return out;
}

function removeTrailingCommas(input: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < input.length) {
    const current = input[i];

    if (inString) {
      out += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      out += current;
      i += 1;
      continue;
    }

    if (current === ",") {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) {
        j += 1;
      }

      if (input[j] === "}" || input[j] === "]") {
        i += 1;
        continue;
      }
    }

    out += current;
    i += 1;
  }

  return out;
}

function normalizeConfig(config: unknown): unknown {
  if (!isRecord(config)) {
    return config;
  }

  return config;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
