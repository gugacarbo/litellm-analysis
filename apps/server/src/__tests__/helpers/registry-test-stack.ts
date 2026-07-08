import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import {
  ApiKeysService,
  ProvidersService,
  parseProviderEncryptionKey,
  RegistryModelsService,
  SettingsService,
} from "@lite-llm/llm-config-service";
import type { ModelSpec } from "@lite-llm/models-repository";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
import type {
  AgentsManager,
  OrchestrationServices,
  RouteOptions,
} from "@lite-llm/server";
import { vi } from "vitest";

type JsonValue = unknown;

type SettingRow = {
  id: string;
  key: string;
  value: JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type ModelRow = {
  id: string;
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
  upstreamModel: string | null;
  upstreamBaseUrl: string | null;
  providerName: string | null;
  requestOptions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

type ApiKeyRow = {
  id: string;
  label: string;
  keyHash: string;
  enabled: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProviderRow = {
  id: string;
  name: string;
  isDefault: boolean;
  provider: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createInMemoryDb() {
  const settings = new Map<string, SettingRow>();
  const models = new Map<string, ModelRow>();
  const providers = new Map<string, ProviderRow>();
  const apiKeysById = new Map<string, ApiKeyRow>();
  const apiKeysByHash = new Map<string, ApiKeyRow>();
  let settingId = 1;
  let modelId = 1;
  let providerId = 1;
  let apiKeyId = 1;

  const resolveProviderName = (
    data: Partial<ModelRow> & {
      provider?: { connect?: { name: string }; disconnect?: boolean };
    },
    existingProviderName: string | null = null,
  ) => {
    if (data.provider?.disconnect) {
      return null;
    }
    if (data.provider?.connect?.name) {
      return data.provider.connect.name;
    }
    return data.providerName ?? existingProviderName;
  };

  return {
    modelProxySetting: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return settings.get(where.key) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...settings.values()].sort((a, b) => a.key.localeCompare(b.key)),
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; value: JsonValue };
          update: { value: JsonValue };
        }) => {
          const existing = settings.get(where.key);
          const now = new Date();
          if (existing) {
            const updated = {
              ...existing,
              value: update.value,
              updatedAt: now,
            };
            settings.set(where.key, updated);
            return updated;
          }
          const created: SettingRow = {
            id: `setting_${settingId++}`,
            key: create.key,
            value: create.value,
            createdAt: now,
            updatedAt: now,
          };
          settings.set(create.key, created);
          return created;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { key: string } }) => {
        const existing = settings.get(where.key);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        settings.delete(where.key);
        return existing;
      }),
    },
    modelProxyModel: {
      findFirst: vi.fn(async ({ where }: { where: { modelName: string } }) => {
        return models.get(where.modelName) ?? null;
      }),
      findUnique: vi.fn(async ({ where }: { where: { modelName: string } }) => {
        return models.get(where.modelName) ?? null;
      }),
      findMany: vi.fn(
        async ({ where }: { where?: { enabled?: boolean } } = {}) => {
          const all = [...models.values()].sort((a, b) =>
            a.modelName.localeCompare(b.modelName),
          );
          if (where?.enabled === undefined) {
            return all;
          }
          return all.filter((row) => row.enabled === where.enabled);
        },
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: Partial<ModelRow> & {
            modelName: string;
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
        }) => {
          const now = new Date();
          const row: ModelRow = {
            id: `model_${modelId++}`,
            modelName: data.modelName,
            enabled: data.enabled ?? true,
            displayName: data.displayName ?? null,
            family: data.family ?? null,
            ownedBy: data.ownedBy ?? null,
            apiMode: data.apiMode ?? null,
            vision: data.vision ?? null,
            contextWindowSize: data.contextWindowSize ?? null,
            maxOutputTokens: data.maxOutputTokens ?? null,
            inputCostPerToken: data.inputCostPerToken ?? null,
            outputCostPerToken: data.outputCostPerToken ?? null,
            upstreamModel: data.upstreamModel ?? null,
            upstreamBaseUrl: data.upstreamBaseUrl ?? null,
            providerName: resolveProviderName(data),
            requestOptions:
              (data.requestOptions as Record<string, unknown> | null) ?? null,
            metadata: (data.metadata as Record<string, unknown> | null) ?? null,
            createdAt: now,
            updatedAt: now,
          };
          models.set(row.modelName, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<ModelRow> & {
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
        }) => {
          const existing = [...models.values()].find(
            (row) => row.id === where.id,
          );
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = {
            ...existing,
            ...data,
            providerName: resolveProviderName(data, existing.providerName),
            updatedAt: new Date(),
          };
          models.set(existing.modelName, updated);
          return updated;
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { modelName: string };
          create: Partial<ModelRow> & {
            modelName: string;
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
          update: Partial<ModelRow> & {
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
        }) => {
          const existing = models.get(where.modelName);
          if (existing) {
            const updated = {
              ...existing,
              ...update,
              providerName: resolveProviderName(update, existing.providerName),
              updatedAt: new Date(),
            };
            models.set(where.modelName, updated);
            return updated;
          }
          const now = new Date();
          const row: ModelRow = {
            id: `model_${modelId++}`,
            modelName: create.modelName,
            enabled: create.enabled ?? true,
            displayName: create.displayName ?? null,
            family: create.family ?? null,
            ownedBy: create.ownedBy ?? null,
            apiMode: create.apiMode ?? null,
            vision: create.vision ?? null,
            contextWindowSize: create.contextWindowSize ?? null,
            maxOutputTokens: create.maxOutputTokens ?? null,
            inputCostPerToken: create.inputCostPerToken ?? null,
            outputCostPerToken: create.outputCostPerToken ?? null,
            upstreamModel: create.upstreamModel ?? null,
            upstreamBaseUrl: create.upstreamBaseUrl ?? null,
            providerName: resolveProviderName(create),
            requestOptions:
              (create.requestOptions as Record<string, unknown> | null) ?? null,
            metadata:
              (create.metadata as Record<string, unknown> | null) ?? null,
            createdAt: now,
            updatedAt: now,
          };
          models.set(row.modelName, row);
          return row;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = [...models.values()].find(
          (row) => row.id === where.id,
        );
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        models.delete(existing.modelName);
        return existing;
      }),
    },
    modelProxyProvider: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => {
        return providers.get(where.name) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...providers.values()].sort((a, b) => a.name.localeCompare(b.name)),
      ),
      create: vi.fn(
        async (args: {
          data: {
            name: string;
            provider?: string | null;
            baseUrl?: string | null;
            apiKey?: string | null;
          };
        }) => {
          const now = new Date();
          const row: ProviderRow = {
            id: `cred_${providerId++}`,
            name: args.data.name,
            isDefault: false,
            provider: args.data.provider ?? null,
            baseUrl: args.data.baseUrl ?? null,
            apiKey: args.data.apiKey ?? null,
            secretRef: null,
            createdAt: now,
            updatedAt: now,
          };
          providers.set(row.name, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { name: string };
          data: Partial<{
            name: string;
            provider: string | null;
            baseUrl: string | null;
          }>;
        }) => {
          const existing = providers.get(where.name);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = { ...existing, ...data, updatedAt: new Date() };
          if (data.name && data.name !== where.name) {
            providers.delete(where.name);
          }
          providers.set(updated.name, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { name: string } }) => {
        const existing = providers.get(where.name);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        providers.delete(where.name);
        return existing;
      }),
    },
    modelProxyApiKey: {
      findUnique: vi.fn(
        async ({ where }: { where: { id?: string; keyHash?: string } }) => {
          if (where.id) {
            return apiKeysById.get(where.id) ?? null;
          }
          if (where.keyHash) {
            return apiKeysByHash.get(where.keyHash) ?? null;
          }
          return null;
        },
      ),
      findMany: vi.fn(
        async ({ where }: { where?: { enabled?: boolean } } = {}) => {
          const all = [...apiKeysById.values()].sort((a, b) =>
            a.label.localeCompare(b.label),
          );
          if (where?.enabled === undefined) {
            return all;
          }
          return all.filter((row) => row.enabled === where.enabled);
        },
      ),
      create: vi.fn(
        async (args: {
          data: { label: string; keyHash: string; enabled: boolean };
        }) => {
          const now = new Date();
          const row: ApiKeyRow = {
            id: `key_${apiKeyId++}`,
            label: args.data.label,
            keyHash: args.data.keyHash,
            enabled: args.data.enabled,
            lastUsedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          apiKeysById.set(row.id, row);
          apiKeysByHash.set(row.keyHash, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<{ enabled: boolean; lastUsedAt: Date }>;
        }) => {
          const existing = apiKeysById.get(where.id);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = { ...existing, ...data, updatedAt: new Date() };
          apiKeysById.set(where.id, updated);
          apiKeysByHash.set(updated.keyHash, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = apiKeysById.get(where.id);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        apiKeysById.delete(where.id);
        apiKeysByHash.delete(existing.keyHash);
        return existing;
      }),
    },
  };
}

export interface RegistryTestStack {
  registry: RouteOptions["registry"];
  modelsService: IModelService;
  providerService: IProviderService;
  dataSource: AnalyticsDataSource;
  agentsManager: AgentsManager;
  orchestration: OrchestrationServices;
  routeOptions: RouteOptions;
  seedConfigModel: (name: string, spec?: Partial<ModelSpec>) => Promise<void>;
  seedRegistryModel: (
    name: string,
    route?: {
      displayName?: string;
      inputCostPerToken?: number;
      enabled?: boolean;
    },
  ) => Promise<void>;
}

export function createRegistryTestStack(): RegistryTestStack {
  const db = createInMemoryDb() as never;
  const settingsService = new SettingsService({ db });
  const registryModelsService = new RegistryModelsService({ db });
  const providersService = new ProvidersService({
    db,
    encryptionKey: parseProviderEncryptionKey({
      APP_ENCRYPTION_KEY: "test-encryption-key-32-bytes-long!!",
    }),
  });
  const apiKeysService = new ApiKeysService({
    db,
    hashKey: async (plain) => `hash:${plain}`,
    verifyKey: async (hash, plain) => hash === `hash:${plain}`,
    generateKey: () => "mp_test_generated_key",
  });

  const configModels = new Map<string, ModelSpec>();

  const modelsService: IModelService = {
    getAll: async () => Object.fromEntries(configModels),
    get: async (key) => configModels.get(key),
    getEnabledModelNames: async () =>
      new Set(
        [...configModels.entries()]
          .filter(([, spec]) => spec.enabled !== false)
          .map(([name]) => name),
      ),
    create: async (key, spec) => {
      if (configModels.has(key)) {
        throw new Error(`Model "${key}" already exists`);
      }
      configModels.set(key, spec);
    },
    update: async (key, spec) => {
      const existing = configModels.get(key);
      if (!existing) {
        throw new Error(`Model "${key}" not found`);
      }
      configModels.set(key, { ...existing, ...spec });
    },
    upsert: async (key, spec) => {
      configModels.set(key, spec);
    },
    delete: async (key) => {
      if (!configModels.delete(key)) {
        throw new Error(`Model "${key}" not found`);
      }
    },
  };

  const providerService: IProviderService = {
    getAll: async () => ({}),
    get: async () => undefined,
    create: async () => {
      throw new Error("not implemented");
    },
    update: async () => {
      throw new Error("not implemented");
    },
    upsert: async () => {
      throw new Error("not implemented");
    },
    delete: async () => {
      throw new Error("not implemented");
    },
  };

  const dataSource = {
    getModels: vi.fn(async () => []),
    getProviders: vi.fn(async () => []),
    getModelDetails: vi.fn(async () => []),
    deleteModelLogs: vi.fn(async () => undefined),
  } as unknown as AnalyticsDataSource;

  const agentsManager = {
    registry: {
      exportAll: vi.fn(async () => undefined),
    },
  } as unknown as AgentsManager;

  const orchestration: OrchestrationServices = {
    dataSource,
    syncGeneratedArtifacts: vi.fn(async () => undefined),
  };

  const registry: RouteOptions["registry"] = {
    settingsService,
    registryModelsService,
    providersService,
    apiKeysService,
    openAiOAuthService: {
      getConnectionStatus: vi.fn(async () => ({
        connected: false,
        accountId: null,
        expiresAt: null,
        baseUrl: "https://chatgpt.com/backend-api/codex",
      })),
      startDeviceAuthorization: vi.fn(async () => ({
        deviceAuthId: "device-auth-id",
        userCode: "ABCD-1234",
        verificationUri: "https://auth.openai.com/codex/device",
        intervalSeconds: 5,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      })),
      pollDeviceAuthorization: vi.fn(async () => ({
        status: "pending" as const,
        intervalSeconds: 5,
      })),
      disconnect: vi.fn(async () => undefined),
      getAuthenticatedRequestConfig: vi.fn(async () => ({
        accessToken: "oauth-token",
        accountId: "acct_test",
        baseUrl: "https://chatgpt.com/backend-api/codex",
        headers: {
          Authorization: "Bearer oauth-token",
        },
        sessionId: "session-test",
      })),
    },
  };

  const routeOptions: RouteOptions = {
    dataSource,
    orchestration,
    heboGateway: {
      handler: vi.fn(async () => Response.json({ object: "list", data: [] })),
      onRequestFinished: vi.fn(() => () => undefined),
      refresh: vi.fn(async () => undefined),
    },
    modelsService,
    providerService,
    registry,
    agentsManager,
  };

  const defaultSpec = (): ModelSpec => ({
    enabled: true,
    limits: { length: 128_000, maxOutput: 4096 },
    cost: { input: 0.000001, output: 0.000002 },
  });

  return {
    registry,
    modelsService,
    providerService,
    dataSource,
    agentsManager,
    orchestration,
    routeOptions,
    seedConfigModel: async (name, spec = {}) => {
      await modelsService.create(name, { ...defaultSpec(), ...spec });
    },
    seedRegistryModel: async (name, route = {}) => {
      await registryModelsService.create(name, {
        displayName: route.displayName,
        inputCostPerToken: route.inputCostPerToken,
        enabled: route.enabled,
      });
    },
  };
}
