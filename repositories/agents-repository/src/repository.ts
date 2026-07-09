import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import {
  normalizeConfig,
  parseConfigContent,
} from "@lite-llm/repository-utils/jsonc";
import {
  agentsConfigSchema,
  type DbConfig,
  pluginsConfigSchema,
} from "./schemas/index";
import { FileStorage, type IStorage } from "./storage";

// Re-export types for convenience
export type {
  AgentEntry,
  AgentsConfig,
  CategoryEntry,
  Cost,
  DbConfig,
  ModelSpec,
  Permission,
  PluginsConfig,
} from "./schemas/index";

interface RepositoryOptions {
  filePath: string;
  pluginsFilePath?: string;
  storage?: IStorage;
  validateOnRead?: boolean;
}

export function resolvePluginsPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = ext === ".jsonc" ? "plugins.jsonc" : "plugins.json";
  return path.join(dir, base);
}

export interface IAgentsRepository {
  read(): Promise<DbConfig>;
  readSync(): DbConfig;
  write(config: DbConfig): Promise<void>;
  validate(config: unknown): config is DbConfig;
  exists(): Promise<boolean>;
  getPath(): string;
  getPluginsPath(): string;
}

function parseAndValidateAgents(
  content: string,
  filePath: string,
  validate: boolean,
): DbConfig {
  const parsed = normalizeConfig(parseConfigContent(content, filePath));

  if (validate) {
    const result = agentsConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid agents config at ${filePath}: ${result.error.message}`,
      );
    }
    return result.data as DbConfig;
  }

  return parsed as DbConfig;
}

function parseAndValidatePlugins(
  content: string,
  filePath: string,
  validate: boolean,
): Record<string, unknown> {
  const parsed = normalizeConfig(parseConfigContent(content, filePath));

  if (validate) {
    const result = pluginsConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid plugins config at ${filePath}: ${result.error.message}`,
      );
    }
    return result.data.plugins;
  }

  return (parsed as Record<string, unknown>).plugins as Record<string, unknown>;
}

function mergeConfig(
  agents: DbConfig,
  plugins: Record<string, unknown>,
): DbConfig {
  return { ...agents, plugins: plugins as DbConfig["plugins"] };
}

function splitConfig(config: DbConfig): {
  agents: Record<string, unknown>;
  plugins: Record<string, unknown>;
} {
  const { plugins, ...agentsPart } = config;
  return {
    agents: agentsPart,
    plugins: plugins ?? {},
  };
}

class AgentsRepository implements IAgentsRepository {
  private readonly filePath: string;
  private readonly pluginsFilePath: string;
  private readonly storage: IStorage;
  private readonly validateOnRead: boolean;

  constructor(options: RepositoryOptions) {
    this.filePath = options.filePath;
    this.pluginsFilePath =
      options.pluginsFilePath ?? resolvePluginsPath(options.filePath);
    this.storage = options.storage ?? new FileStorage();
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<DbConfig> {
    const agentsContent = await this.storage.read(this.filePath);
    const agents = parseAndValidateAgents(
      agentsContent,
      this.filePath,
      this.validateOnRead,
    );

    let plugins: Record<string, unknown> = {};
    if (await this.storage.exists(this.pluginsFilePath)) {
      const pluginsContent = await this.storage.read(this.pluginsFilePath);
      plugins = parseAndValidatePlugins(
        pluginsContent,
        this.pluginsFilePath,
        this.validateOnRead,
      );
    }

    return mergeConfig(agents, plugins);
  }

  readSync(): DbConfig {
    const agentsContent = readFileSync(this.filePath, "utf-8");
    const agents = parseAndValidateAgents(
      agentsContent,
      this.filePath,
      this.validateOnRead,
    );

    let plugins: Record<string, unknown> = {};
    if (existsSync(this.pluginsFilePath)) {
      const pluginsContent = readFileSync(this.pluginsFilePath, "utf-8");
      plugins = parseAndValidatePlugins(
        pluginsContent,
        this.pluginsFilePath,
        this.validateOnRead,
      );
    }

    return mergeConfig(agents, plugins);
  }

  async write(config: DbConfig): Promise<void> {
    const { agents: agentsPart, plugins } = splitConfig(config);

    const agentsResult = agentsConfigSchema.safeParse(
      normalizeConfig(agentsPart),
    );
    if (!agentsResult.success) {
      throw new Error(`Invalid agents config: ${agentsResult.error.message}`);
    }

    const pluginsResult = pluginsConfigSchema.safeParse(
      normalizeConfig({ plugins }),
    );
    if (!pluginsResult.success) {
      throw new Error(`Invalid plugins config: ${pluginsResult.error.message}`);
    }

    await this.storage.write(
      this.filePath,
      JSON.stringify(agentsResult.data, null, 2),
    );
    await this.storage.write(
      this.pluginsFilePath,
      JSON.stringify(pluginsResult.data, null, 2),
    );
  }

  validate(config: unknown): config is DbConfig {
    if (typeof config !== "object" || config === null) return false;
    const { plugins, ...agentsPart } = config as Record<string, unknown>;
    const agentsResult = agentsConfigSchema.safeParse(agentsPart);
    const pluginsResult = pluginsConfigSchema.safeParse({ plugins });
    return agentsResult.success && pluginsResult.success;
  }

  async exists(): Promise<boolean> {
    const agentsExists = await this.storage.exists(this.filePath);
    const pluginsExists = await this.storage.exists(this.pluginsFilePath);
    return agentsExists && pluginsExists;
  }

  getPath(): string {
    return this.filePath;
  }

  getPluginsPath(): string {
    return this.pluginsFilePath;
  }
}

// ── Factory ──

export function createRepository(
  options: RepositoryOptions,
): IAgentsRepository {
  return new AgentsRepository(options);
}
