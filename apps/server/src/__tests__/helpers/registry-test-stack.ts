import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type {
  ModelProxyModelRecord,
  ModelProxySettingRecord,
  ModelRouteUpdate,
  ProviderRecord,
} from "@lite-llm/llm-config-service";
import {
  ApiKeysService,
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

type ApiKeyRow = {
  id: string;
  label: string;
  keyHash: string;
  enabled: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type JsonValue = unknown;

function createInMemoryDb(providers: Map<string, ProviderRecord>) {
  const settings = new Map<string, ModelProxySettingRecord>();
  const models = new Map<string, ModelProxyModelRecord>();
  const apiKeysById = new Map<string, ApiKeyRow>();
  const apiKeysByHash = new Map<string, ApiKeyRow>();
  let settingId = 1;
  let modelId = 1;
  let providerId = 1;
  let apiKeyId = 1;

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
            const updated: ModelProxySettingRecord = {
              ...existing,
              value: update.value,
              updatedAt: now,
            };
            settings.set(where.key, updated);
            return updated;
          }
          const created: ModelProxySettingRecord = {
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
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { modelId?: string; providerId?: string; id?: string };
        }) => {
          return (
            [...models.values()].find((row) => {
              if (where.id && row.id !== where.id) {
                return false;
              }
              if (where.modelId && row.modelId !== where.modelId) {
                return false;
              }
              if (where.providerId && row.providerId !== where.providerId) {
                return false;
              }
              return true;
            }) ?? null
          );
        },
      ),
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { modelId?: string; providerId?: string; id?: string };
        }) => {
          return (
            [...models.values()].find((row) => {
              if (where.id && row.id !== where.id) {
                return false;
              }
              if (where.modelId && row.modelId !== where.modelId) {
                return false;
              }
              if (where.providerId && row.providerId !== where.providerId) {
                return false;
              }
              return true;
            }) ?? null
          );
        },
      ),
      findMany: vi.fn(
        async ({ where }: { where?: { enabled?: boolean } } = {}) => {
          const all = [...models.values()].sort((a, b) =>
            a.modelId.localeCompare(b.modelId),
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
          data: Partial<ModelProxyModelRecord> & { modelId: string };
        }) => {
          const existing = [...models.values()].find((row) => {
            if (row.modelId !== data.modelId) {
              return false;
            }
            if (data.providerId && row.providerId !== data.providerId) {
              return false;
            }
            return data.providerId ? true : true;
          });
          if (existing) {
            const error = new Error("Already exists") as Error & {
              code: string;
            };
            error.code = "P2002";
            throw error;
          }
          const now = new Date();
          const row: ModelProxyModelRecord = {
            id: `model_${modelId++}`,
            modelId: data.modelId,
            enabled: data.enabled ?? true,
            displayName: data.displayName ?? null,
            family: data.family ?? null,
            canonicalSlug: data.canonicalSlug ?? null,
            description: data.description ?? null,
            contextLength: data.contextLength ?? null,
            maxCompletionTokens: data.maxCompletionTokens ?? null,
            knowledgeCutoff: data.knowledgeCutoff ?? null,
            expirationDate: data.expirationDate ?? null,
            architecture: data.architecture ?? null,
            reasoning: data.reasoning ?? null,
            supportedParameters: data.supportedParameters ?? null,
            defaultParameters: data.defaultParameters ?? null,
            perRequestLimits: data.perRequestLimits ?? null,
            pricing: data.pricing ?? null,
            requestOptions: data.requestOptions ?? null,
            providerId: data.providerId ?? null,
            reasoningApiId: data.reasoningApiId ?? null,
            createdAt: now,
            updatedAt: now,
          };
          models.set(row.id, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<ModelProxyModelRecord>;
        }) => {
          const existing = models.get(where.id);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated: ModelProxyModelRecord = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          models.set(existing.id, updated);
          return updated;
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { modelId: string };
          create: Partial<ModelProxyModelRecord> & { modelId: string };
          update: Partial<ModelProxyModelRecord>;
        }) => {
          const existing = [...models.values()].find(
            (row) =>
              row.modelId === where.modelId &&
              (create.providerId ? row.providerId === create.providerId : true),
          );
          if (existing) {
            const updated: ModelProxyModelRecord = {
              ...existing,
              ...update,
              updatedAt: new Date(),
            };
            models.set(existing.id, updated);
            return updated;
          }
          const now = new Date();
          const row: ModelProxyModelRecord = {
            id: `model_${modelId++}`,
            modelId: create.modelId,
            enabled: create.enabled ?? true,
            displayName: create.displayName ?? null,
            family: create.family ?? null,
            canonicalSlug: create.canonicalSlug ?? null,
            description: create.description ?? null,
            contextLength: create.contextLength ?? null,
            maxCompletionTokens: create.maxCompletionTokens ?? null,
            knowledgeCutoff: create.knowledgeCutoff ?? null,
            expirationDate: create.expirationDate ?? null,
            architecture: create.architecture ?? null,
            reasoning: create.reasoning ?? null,
            supportedParameters: create.supportedParameters ?? null,
            defaultParameters: create.defaultParameters ?? null,
            perRequestLimits: create.perRequestLimits ?? null,
            pricing: create.pricing ?? null,
            requestOptions: create.requestOptions ?? null,
            providerId: create.providerId ?? null,
            reasoningApiId: create.reasoningApiId ?? null,
            createdAt: now,
            updatedAt: now,
          };
          models.set(row.id, row);
          return row;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = models.get(where.id);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        models.delete(existing.id);
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
            isDefault?: boolean;
            provider?: string | null;
            baseUrl?: string | null;
            apiKey?: string | null;
            secretRef?: string | null;
          };
        }) => {
          const now = new Date();
          const row: ProviderRecord = {
            id: `cred_${providerId++}`,
            name: args.data.name,
            isDefault: args.data.isDefault ?? false,
            provider: args.data.provider ?? null,
            baseUrl: args.data.baseUrl ?? null,
            apiKey: args.data.apiKey ?? null,
            secretRef: args.data.secretRef ?? null,
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
  agentsManager?: AgentsManager;
  orchestration: OrchestrationServices;
  routeOptions: RouteOptions;
  seedConfigModel: (name: string, spec?: Partial<ModelSpec>) => Promise<void>;
  seedRegistryModel: (name: string, route?: ModelRouteUpdate) => Promise<void>;
}

export function createRegistryTestStack(): RegistryTestStack {
  const providers = new Map<string, ProviderRecord>();
  const db = createInMemoryDb(providers) as never;
  const settingsService = new SettingsService({ db });
  const registryModelsService = new RegistryModelsService({ db });
  let providerRecordId = 1;
  const providersService: RouteOptions["registry"]["providersService"] = {
    async get(name: string) {
      return providers.get(name) ?? null;
    },
    async list() {
      return [...providers.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    },
    async create(input) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error("Provider name must be a non-empty string");
      }
      if (providers.has(trimmedName)) {
        throw new Error(`Provider "${trimmedName}" already exists`);
      }
      const now = new Date();
      const record: ProviderRecord = {
        id: `provider_${providerRecordId++}`,
        name: trimmedName,
        isDefault: input.isDefault ?? false,
        provider: input.provider ?? null,
        baseUrl: input.baseUrl ?? null,
        apiKey: input.apiKey ?? null,
        secretRef: input.secretRef ?? null,
        createdAt: now,
        updatedAt: now,
      };
      providers.set(trimmedName, record);
      return record;
    },
    async update(name, input) {
      const existing = providers.get(name);
      if (!existing) {
        throw new Error(`Provider "${name}" not found`);
      }
      const updated: ProviderRecord = {
        ...existing,
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isDefault !== undefined
          ? { isDefault: input.isDefault }
          : {}),
        ...(input.provider !== undefined ? { provider: input.provider } : {}),
        ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
        ...(input.apiKey !== undefined ? { apiKey: input.apiKey } : {}),
        ...(input.secretRef !== undefined
          ? { secretRef: input.secretRef }
          : {}),
        updatedAt: new Date(),
      };
      if (updated.name !== name) {
        providers.delete(name);
      }
      providers.set(updated.name, updated);
      return updated;
    },
    async delete(name) {
      return providers.delete(name);
    },
  };
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
      discoverModels: vi.fn(async () => []),
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
    agentsManager: undefined,
  };

  const defaultSpec = (): ModelSpec => ({
    enabled: true,
    displayName: "Test Model",
    contextLength: 128_000,
    maxCompletionTokens: 4096,
    pricing: { input: 0.000001, output: 0.000002 },
  });

  return {
    registry,
    modelsService,
    providerService,
    dataSource,
    agentsManager: undefined,
    orchestration,
    routeOptions,
    seedConfigModel: async (name, spec = {}) => {
      await modelsService.create(name, { ...defaultSpec(), ...spec });
    },
    seedRegistryModel: async (name, route = {}) => {
      await registryModelsService.create(name, route);
    },
  };
}
