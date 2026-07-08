import { type db as drizzleDb, getDb } from "@lite-llm/database/client";
import { modelProxyModels } from "@lite-llm/database/schema/model-proxy";
import {
  ProvidersRepository,
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/llm-config-service";
import { normalizeConfig } from "@lite-llm/repository-utils/jsonc";
import { asc, count, eq } from "drizzle-orm";
import type { IModelsRepository } from "./interfaces";
import {
  type ModelSpec,
  type ModelsConfig,
  modelsConfigSchema,
} from "./schemas/index";
import type { Provider } from "./schemas/provider";

export interface DbModelsRepositoryOptions {
  db?: typeof drizzleDb;
  validateOnRead?: boolean;
}

function buildModelKey(
  modelName: string,
  providerName?: string | null,
): string {
  const trimmedProviderName = providerName?.trim();
  return trimmedProviderName
    ? `${trimmedProviderName}/${modelName}`
    : modelName;
}

function parseModelKey(modelKey: string): {
  modelName: string;
  providerName: string | null;
} {
  const trimmedKey = modelKey.trim();
  const slashIndex = trimmedKey.indexOf("/");

  if (slashIndex <= 0 || slashIndex === trimmedKey.length - 1) {
    return {
      modelName: trimmedKey,
      providerName: null,
    };
  }

  return {
    providerName: trimmedKey.slice(0, slashIndex).trim() || null,
    modelName: trimmedKey.slice(slashIndex + 1).trim(),
  };
}

function resolveProviderField(
  providerKey: string,
  provider: Provider,
): string | null {
  if (provider.adapter) {
    return provider.adapter;
  }
  if (provider.ownedBy) {
    return provider.ownedBy;
  }
  return providerKey;
}

function modelSpecFromRow(
  row: typeof modelProxyModels.$inferSelect,
): ModelSpec {
  const base: ModelSpec = {
    enabled: row.enabled,
    displayName: row.displayName ?? row.modelId,
    contextLength: row.contextLength ?? 200000,
    maxCompletionTokens: row.maxCompletionTokens ?? 32768,
  };

  if (row.family) {
    base.family = row.family;
  }
  if (row.canonicalSlug) {
    base.canonicalSlug = row.canonicalSlug;
  }
  if (row.description) {
    base.description = row.description;
  }
  if (row.knowledgeCutoff) {
    base.knowledgeCutoff = row.knowledgeCutoff;
  }
  if (row.expirationDate) {
    base.expirationDate = row.expirationDate;
  }
  if (row.architecture) {
    base.architecture = row.architecture as Record<string, unknown>;
  }
  if (row.reasoning) {
    base.reasoning = row.reasoning as { effort?: "low" | "medium" | "high" | "xhigh" };
  }
  if (row.supportedParameters) {
    base.supportedParameters = row.supportedParameters as unknown as Record<string, unknown>;
  }
  if (row.defaultParameters) {
    base.defaultParameters = row.defaultParameters as Record<string, unknown>;
  }
  if (row.perRequestLimits) {
    base.perRequestLimits = row.perRequestLimits as Record<string, unknown>;
  }
  if (row.pricing) {
    base.pricing = row.pricing as { input?: number; output?: number };
  }

  return base;
}

function modelRowFromSpec(
  modelName: string,
  providerId: string | null,
  spec: ModelSpec,
): typeof modelProxyModels.$inferInsert {
  return {
    modelId: modelName,
    providerId,
    enabled: spec.enabled ?? true,
    displayName: spec.displayName ?? modelName,
    family: spec.family ?? null,
    canonicalSlug: spec.canonicalSlug ?? null,
    description: spec.description ?? null,
    contextLength: spec.contextLength,
    maxCompletionTokens: spec.maxCompletionTokens,
    knowledgeCutoff: spec.knowledgeCutoff ?? null,
    expirationDate: spec.expirationDate ?? null,
    architecture: (spec.architecture ?? null) as never,
    reasoning: (spec.reasoning ?? null) as never,
    supportedParameters: (spec.supportedParameters ?? null) as never,
    defaultParameters: (spec.defaultParameters ?? null) as never,
    perRequestLimits: (spec.perRequestLimits ?? null) as never,
    pricing: (spec.pricing ?? null) as never,
    requestOptions: null,
    reasoningApiId: null,
  };
}

export class DbModelsRepository implements IModelsRepository {
  private readonly db: typeof drizzleDb;
  private readonly settings: SettingsRepository;
  private readonly providers: ProvidersRepository;
  private readonly validateOnRead: boolean;

  constructor(options: DbModelsRepositoryOptions = {}) {
    this.db = options.db ?? getDb();
    this.settings = new SettingsRepository(this.db);
    this.providers = new ProvidersRepository(this.db);
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<ModelsConfig> {
    const modelRows = await this.db
      .select()
      .from(modelProxyModels)
      .orderBy(asc(modelProxyModels.modelId));
    const providerRows = await this.providers.list();
    const providerIdToName = new Map(
      providerRows.map((p) => [p.id, p.name]),
    );
    const defaultProviderRow = await this.settings.findByKey(
      SETTING_KEYS.DEFAULT_PROVIDER,
    );

    const defaultProvider =
      defaultProviderRow &&
      typeof defaultProviderRow.value === "object" &&
      defaultProviderRow.value !== null &&
      "default_provider" in defaultProviderRow.value &&
      typeof (defaultProviderRow.value as { default_provider?: unknown })
        .default_provider === "string"
        ? (defaultProviderRow.value as { default_provider: string })
            .default_provider
        : "";

    const provider: Record<string, Provider> = {
      "local-proxy": {
        name: "Local Model Proxy",
        baseUrl: "http://localhost:3008/v1",
        defaultProvider,
      },
    };

    for (const row of providerRows) {
      const providerKey = row.provider ?? row.name;
      provider[providerKey] = {
        name: row.name,
        baseUrl: row.baseUrl ?? "",
        defaultProvider: row.name,
        ...(row.provider === "openai-compatible"
          ? { adapter: "openai-compatible" as const }
          : {}),
        ...(row.provider && row.provider !== "openai-compatible"
          ? { ownedBy: row.provider }
          : {}),
      };
    }

    const models: Record<string, ModelSpec> = {};
    for (const row of modelRows) {
      const providerName = row.providerId
        ? providerIdToName.get(row.providerId) ?? null
        : null;
      models[buildModelKey(row.modelId, providerName)] =
        modelSpecFromRow(row);
    }

    const config: ModelsConfig = {
      version: 1,
      provider,
      models,
    };

    if (this.validateOnRead) {
      const result = modelsConfigSchema.safeParse(config);
      if (!result.success) {
        throw new Error(
          `Invalid models config from database: ${result.error.message}`,
        );
      }
      return result.data;
    }

    return config;
  }

  readSync(): ModelsConfig {
    throw new Error(
      "readSync() is not supported with database-backed storage; use read() instead",
    );
  }

  async write(config: ModelsConfig): Promise<void> {
    const normalizedConfig = normalizeConfig(config);
    const result = modelsConfigSchema.safeParse(normalizedConfig);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    const validated = result.data;
    const localProxy = validated.provider["local-proxy"];
    const defaultProviderName = localProxy?.defaultProvider?.trim() ?? "";

    if (defaultProviderName) {
      await this.settings.upsert(SETTING_KEYS.DEFAULT_PROVIDER, {
        default_provider: defaultProviderName,
      });
    } else {
      await this.settings.deleteByKey(SETTING_KEYS.DEFAULT_PROVIDER);
    }

    for (const [providerKey, providerSpec] of Object.entries(
      validated.provider,
    )) {
      if (providerKey === "local-proxy") {
        continue;
      }

      const providerName = providerSpec.defaultProvider?.trim();
      if (!providerName) {
        continue;
      }

      const providerData = {
        name: providerName,
        provider: resolveProviderField(providerKey, providerSpec),
        baseUrl: providerSpec.baseUrl || null,
      };

      const existing = await this.providers.findByName(providerName);
      if (existing) {
        await this.providers.update(providerName, providerData);
      } else {
        await this.providers.create(providerData);
      }
    }

    const desiredNames = new Set(Object.keys(validated.models));
    const existingModels = await this.db.select().from(modelProxyModels);
    const providerRows = await this.providers.list();
    const providerNameToId = new Map(
      providerRows.map((p) => [p.name, p.id]),
    );
    for (const existing of existingModels) {
      const providerName = existing.providerId
        ? providerRows.find((p) => p.id === existing.providerId)?.name ?? null
        : null;
      const existingKey = buildModelKey(
        existing.modelId,
        providerName,
      );
      if (!desiredNames.has(existingKey)) {
        await this.db
          .delete(modelProxyModels)
          .where(eq(modelProxyModels.id, existing.id));
      }
    }

    const existingByKey = new Map(
      existingModels.map((row) => {
        const providerName = row.providerId
          ? providerRows.find((p) => p.id === row.providerId)?.name ?? null
          : null;
        return [
          buildModelKey(row.modelId, providerName),
          row,
        ];
      }),
    );

    for (const [modelKey, spec] of Object.entries(validated.models)) {
      const { modelName, providerName } = parseModelKey(modelKey);
      const providerId = providerName
        ? providerNameToId.get(providerName) ?? null
        : null;
      const data = modelRowFromSpec(modelName, providerId, spec);
      const existing = existingByKey.get(modelKey);
      if (existing) {
        await this.db
          .update(modelProxyModels)
          .set({
            enabled: data.enabled,
            displayName: data.displayName,
            family: data.family,
            canonicalSlug: data.canonicalSlug,
            description: data.description,
            contextLength: data.contextLength,
            maxCompletionTokens: data.maxCompletionTokens,
            knowledgeCutoff: data.knowledgeCutoff,
            expirationDate: data.expirationDate,
            architecture: data.architecture,
            reasoning: data.reasoning,
            supportedParameters: data.supportedParameters,
            defaultParameters: data.defaultParameters,
            perRequestLimits: data.perRequestLimits,
            pricing: data.pricing,
          })
          .where(eq(modelProxyModels.id, existing.id));
      } else {
        await this.db.insert(modelProxyModels).values(data);
      }
    }
  }

  validate(config: unknown): config is ModelsConfig {
    const result = modelsConfigSchema.safeParse(config);
    return result.success;
  }

  async exists(): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(modelProxyModels);
    return result[0].count > 0;
  }

  getPath(): string {
    return "database://model_proxy_models";
  }
}

export function createDbRepository(
  options: DbModelsRepositoryOptions = {},
): IModelsRepository {
  return new DbModelsRepository(options);
}
