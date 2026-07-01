import {
  CredentialsRepository,
  ModelsRepository as RegistryModelsRepository,
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/model-proxy-registry-service";
import {
  getModelProxyPrisma,
  Prisma,
  type PrismaClient,
} from "@lite-llm/model-proxy-repository";
import { normalizeConfig } from "@lite-llm/repository-utils/jsonc";
import { applyMetadataToModelSpec, metadataFromModelSpec } from "./metadata";
import type { IModelsRepository } from "./repository";
import {
  type ModelSpec,
  type ModelsConfig,
  modelsConfigSchema,
} from "./schemas/index";
import type { Provider } from "./schemas/provider";

export interface DbModelsRepositoryOptions {
  prisma?: PrismaClient;
  validateOnRead?: boolean;
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
  metadata: Prisma.JsonValue;
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
  spec: ModelSpec,
): Prisma.ModelProxyModelCreateInput {
  const metadata = metadataFromModelSpec(spec);

  return {
    modelName,
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
    metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.DbNull,
  };
}

export class DbModelsRepository implements IModelsRepository {
  private readonly prisma: PrismaClient;
  private readonly settings: SettingsRepository;
  private readonly models: RegistryModelsRepository;
  private readonly credentials: CredentialsRepository;
  private readonly validateOnRead: boolean;

  constructor(options: DbModelsRepositoryOptions = {}) {
    this.prisma = options.prisma ?? getModelProxyPrisma();
    this.settings = new SettingsRepository(this.prisma);
    this.models = new RegistryModelsRepository(this.prisma);
    this.credentials = new CredentialsRepository(this.prisma);
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<ModelsConfig> {
    const modelRows = await this.prisma.modelProxyModel.findMany({
      orderBy: { modelName: "asc" },
    });
    const credentialRows = await this.credentials.list();
    const defaultCredentialRow = await this.settings.findByKey(
      SETTING_KEYS.DEFAULT_CREDENTIAL,
    );

    const defaultCredential =
      defaultCredentialRow &&
      typeof defaultCredentialRow.value === "object" &&
      defaultCredentialRow.value !== null &&
      "default_credential" in defaultCredentialRow.value &&
      typeof (defaultCredentialRow.value as { default_credential?: unknown })
        .default_credential === "string"
        ? (defaultCredentialRow.value as { default_credential: string })
            .default_credential
        : "";

    const provider: Record<string, Provider> = {
      "local-proxy": {
        name: "Local Model Proxy",
        baseUrl: "http://localhost:3008/v1",
        defaultCredential,
        apiKey: "env:MODEL_PROXY_API_KEY",
      },
    };

    for (const credential of credentialRows) {
      const providerKey = credential.provider ?? credential.name;
      provider[providerKey] = {
        name: credential.name,
        baseUrl: credential.baseUrl ?? "",
        defaultCredential: credential.name,
        ...(credential.provider === "openai-compatible"
          ? { adapter: "openai-compatible" as const }
          : {}),
        ...(credential.provider && credential.provider !== "openai-compatible"
          ? { ownedBy: credential.provider }
          : {}),
        ...(secretRefToApiKey(credential.secretRef)
          ? { apiKey: secretRefToApiKey(credential.secretRef) }
          : {}),
      };
    }

    const models: Record<string, ModelSpec> = {};
    for (const row of modelRows) {
      models[row.modelName] = modelSpecFromRow(row);
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
    const defaultCredentialName = localProxy?.defaultCredential?.trim() ?? "";

    if (defaultCredentialName) {
      await this.settings.upsert(SETTING_KEYS.DEFAULT_CREDENTIAL, {
        default_credential: defaultCredentialName,
      });
    } else {
      await this.settings.deleteByKey(SETTING_KEYS.DEFAULT_CREDENTIAL);
    }

    for (const [providerKey, providerSpec] of Object.entries(
      validated.provider,
    )) {
      if (providerKey === "local-proxy") {
        continue;
      }

      const credentialName = providerSpec.defaultCredential?.trim();
      if (!credentialName) {
        continue;
      }

      const secretRef = parseApiKeyToSecretRef(providerSpec.apiKey);
      const credentialData = {
        name: credentialName,
        provider: resolveProviderField(providerKey, providerSpec),
        baseUrl: providerSpec.baseUrl || null,
        secretRef:
          secretRef ??
          `${credentialName.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`,
      };

      const existing = await this.credentials.findByName(credentialName);
      if (existing) {
        await this.credentials.update(credentialName, credentialData);
      } else {
        await this.credentials.create(credentialData);
      }
    }

    const desiredNames = new Set(Object.keys(validated.models));
    const existingModels = await this.models.list();
    for (const existing of existingModels) {
      if (!desiredNames.has(existing.modelName)) {
        await this.models.delete(existing.modelName);
      }
    }

    for (const [modelName, spec] of Object.entries(validated.models)) {
      const data = modelRowFromSpec(modelName, spec);
      await this.prisma.modelProxyModel.upsert({
        where: { modelName },
        create: data,
        update: {
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
        },
      });
    }
  }

  validate(config: unknown): config is ModelsConfig {
    const result = modelsConfigSchema.safeParse(config);
    return result.success;
  }

  async exists(): Promise<boolean> {
    const count = await this.prisma.modelProxyModel.count();
    return count > 0;
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
