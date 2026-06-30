import {
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/model-proxy-registry-service";
import {
  getModelProxyPrisma,
  type Prisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import { normalizeConfig } from "@lite-llm/repository-utils/jsonc";
import type { IAgentsRepository } from "./repository";
import {
  agentsConfigSchema,
  type DbConfig,
  pluginsConfigSchema,
} from "./schemas/index";

export const DASHBOARD_AGENTS_KEY = SETTING_KEYS.DASHBOARD_AGENTS;
export const DASHBOARD_PLUGINS_KEY = SETTING_KEYS.DASHBOARD_PLUGINS;

export interface DbAgentsRepositoryOptions {
  prisma?: PrismaClient;
  validateOnRead?: boolean;
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

function mergeConfig(
  agents: DbConfig,
  plugins: Record<string, unknown>,
): DbConfig {
  return { ...agents, plugins: plugins as DbConfig["plugins"] };
}

function parseAgentsValue(value: unknown, validate: boolean): DbConfig {
  const parsed = normalizeConfig(value);

  if (validate) {
    const result = agentsConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid agents config in database: ${result.error.message}`,
      );
    }
    return result.data as DbConfig;
  }

  return parsed as DbConfig;
}

function parsePluginsValue(
  value: unknown,
  validate: boolean,
): Record<string, unknown> {
  const parsed = normalizeConfig({ plugins: value });
  const plugins =
    (parsed as { plugins?: Record<string, unknown> }).plugins ?? {};

  if (validate) {
    const result = pluginsConfigSchema.safeParse({ plugins });
    if (!result.success) {
      throw new Error(
        `Invalid plugins config in database: ${result.error.message}`,
      );
    }
    return result.data.plugins;
  }

  return plugins;
}

export class DbAgentsRepository implements IAgentsRepository {
  private readonly settings: SettingsRepository;
  private readonly validateOnRead: boolean;

  constructor(options: DbAgentsRepositoryOptions = {}) {
    const prisma = options.prisma ?? getModelProxyPrisma();
    this.settings = new SettingsRepository(prisma);
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<DbConfig> {
    const agentsRow = await this.settings.findByKey(DASHBOARD_AGENTS_KEY);
    const pluginsRow = await this.settings.findByKey(DASHBOARD_PLUGINS_KEY);

    const agents = agentsRow
      ? parseAgentsValue(agentsRow.value, this.validateOnRead)
      : parseAgentsValue(
          { version: 1, agents: {}, categories: {} },
          this.validateOnRead,
        );

    const plugins = pluginsRow
      ? parsePluginsValue(pluginsRow.value, this.validateOnRead)
      : {};

    return mergeConfig(agents, plugins);
  }

  readSync(): DbConfig {
    throw new Error(
      "readSync() is not supported with database-backed storage; use read() instead",
    );
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

    await this.settings.upsert(
      DASHBOARD_AGENTS_KEY,
      agentsResult.data as Prisma.InputJsonValue,
    );
    await this.settings.upsert(
      DASHBOARD_PLUGINS_KEY,
      pluginsResult.data.plugins as Prisma.InputJsonValue,
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
    const agentsRow = await this.settings.findByKey(DASHBOARD_AGENTS_KEY);
    const pluginsRow = await this.settings.findByKey(DASHBOARD_PLUGINS_KEY);
    return agentsRow !== null && pluginsRow !== null;
  }

  getPath(): string {
    return `database://${DASHBOARD_AGENTS_KEY}`;
  }

  getPluginsPath(): string {
    return `database://${DASHBOARD_PLUGINS_KEY}`;
  }
}

export function createDbRepository(
  options: DbAgentsRepositoryOptions = {},
): IAgentsRepository {
  return new DbAgentsRepository(options);
}
