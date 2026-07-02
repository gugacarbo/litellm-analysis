import {
  ProvidersRepository,
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/llm-config-service";
import { db as drizzleDb, getDb } from "@lite-llm/database/client";
import { modelProxyModels } from "@lite-llm/database/schema/model-proxy";
import { eq, asc, count } from "drizzle-orm";
import { normalizeConfig } from "@lite-llm/repository-utils/jsonc";
import { applyMetadataToModelSpec, metadataFromModelSpec } from "./metadata";
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

function buildModelKey(modelName: string, providerName?: string | null): string {
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

function parseApiKeyToSecretRef(apiKey: string | undefined): string | null {
  if (!apiKey?.trim()) {
    return null;
  }

  const trimmed = apiKey.trim();
  if (trimmed.startsWith("env:")) {
    return trimmed.slice(4).trim() || null;
  }

  return null;
}

function secretRefToApiKey(secretRef: string | null): string | undefined {
  const trimmed = secretRef?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    return `env:${trimmed}`;
  }

  return undefined;
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

function modelSpecFromRow(row: {
  modelName: string;
  enabled: boolean;
  displayName: string | null;
  family: string | null;
  ownedBy: string | null;
  apiMode: string | null;
  vision: boolean | null;
  contextWindowSize: number | null;
  maxOutputTokens: number | null;
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
  metadata: unknown;
}): ModelSpec {
  const base: ModelSpec = {
    enabled: row.enabled,
    displayName: row.displayName ?? row.modelName,
    limits: {
      length: row.contextWindowSize ?? 200000,
      maxOutput: row.maxOutputTokens ?? 32768,
    },
  };

  if (row.family) {
    base.family = row.family;
  }
  if (row.ownedBy) {
    base.ownedBy = row.ownedBy;
  }
  if (row.apiMode === "openai" || row.apiMode === "anthropic") {
    base.apiMode = row.apiMode;
  }
  if (row.vision !== null && row.vision !== undefined) {
    base.vision = row.vision;
  }
  if (row.inputCostPerToken !== null || row.outputCostPerToken !== null) {
    base.cost = {
      input: row.inputCostPerToken ?? 0,
      output: row.outputCostPerToken ?? 0,
    };
  }

  return applyMetadataToModelSpec(base, row.metadata);
}

function modelRowFromSpec(
  modelName: string,
  providerName: string | null,
  spec: ModelSpec,
): typeof modelProxyModels.$inferInsert {
  const metadata = metadataFromModelSpec(spec);

  return {
    modelName,
    providerName,
    enabled: spec.enabled ?? true,
    displayName: spec.displayName || modelName,
    family: spec.family ?? null,
    ownedBy: spec.ownedBy ?? null,
    apiMode: spec.apiMode ?? null,
    vision: spec.vision ?? null,
    contextWindowSize: spec.limits.length,
    maxOutputTokens: spec.limits.maxOutput,
    inputCostPerToken: spec.cost?.input ?? null,
    outputCostPerToken: spec.cost?.output ?? null,
    metadata,
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
      .orderBy(asc(modelProxyModels.modelName));
    const providerRows = await this.providers.list();
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
        apiKey: "env:MODEL_PROXY_API_KEY",
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
        ...(secretRefToApiKey(row.secretRef)
          ? { apiKey: secretRefToApiKey(row.secretRef) }
          : {}),
      };
    }

    const models: Record<string, ModelSpec> = {};
    for (const row of modelRows) {
      models[buildModelKey(row.modelName, row.providerName)] = modelSpecFromRow(
        row,
      );
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

      const secretRef = parseApiKeyToSecretRef(providerSpec.apiKey);
      const providerData = {
        name: providerName,
        provider: resolveProviderField(providerKey, providerSpec),
        baseUrl: providerSpec.baseUrl || null,
        secretRef:
          secretRef ??
          `${providerName.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`,
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
    for (const existing of existingModels) {
      const existingKey = buildModelKey(
        existing.modelName,
        existing.providerName,
      );
      if (!desiredNames.has(existingKey)) {
        await this.db
          .delete(modelProxyModels)
          .where(eq(modelProxyModels.id, existing.id));
      }
    }

    const existingByKey = new Map(
      existingModels.map((row) => [
        buildModelKey(row.modelName, row.providerName),
        row,
      ]),
    );

    for (const [modelKey, spec] of Object.entries(validated.models)) {
      const { modelName, providerName } = parseModelKey(modelKey);
      const data = modelRowFromSpec(modelName, providerName, spec);
      const existing = existingByKey.get(modelKey);
      if (existing) {
        await this.db
          .update(modelProxyModels)
          .set({
            enabled: data.enabled,
            displayName: data.displayName,
            family: data.family,
            ownedBy: data.ownedBy,
            apiMode: data.apiMode,
            vision: data.vision,
            contextWindowSize: data.contextWindowSize,
            maxOutputTokens: data.maxOutputTokens,
            inputCostPerToken: data.inputCostPerToken,
            outputCostPerToken: data.outputCostPerToken,
            metadata: data.metadata,
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
