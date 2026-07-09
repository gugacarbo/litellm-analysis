import type { ApiKeyRecord } from "../../types/api-keys.js";
import type { ModelProxyModelRecord } from "../../types/model-route.js";
import type { ProviderRecord } from "../../types/providers.js";
import type { ModelProxySettingRecord } from "../../types/settings.js";

export function createApiKeysRepositoryMock() {
  const rowsById = new Map<string, ApiKeyRecord>();
  let idCounter = 1;

  return {
    async listEnabled(): Promise<ApiKeyRecord[]> {
      return [...rowsById.values()]
        .filter((row) => row.enabled)
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    async list(): Promise<ApiKeyRecord[]> {
      return [...rowsById.values()].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    },

    async findById(id: string): Promise<ApiKeyRecord | null> {
      return rowsById.get(id) ?? null;
    },

    async create(data: {
      label: string;
      keyHash: string;
      enabled?: boolean;
    }): Promise<ApiKeyRecord> {
      const now = new Date();
      const row: ApiKeyRecord = {
        id: `key_${idCounter++}`,
        label: data.label,
        keyHash: data.keyHash,
        enabled: data.enabled ?? true,
        lastUsedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      rowsById.set(row.id, row);
      return row;
    },

    async setEnabled(
      id: string,
      enabled: boolean,
    ): Promise<ApiKeyRecord | null> {
      const existing = rowsById.get(id);
      if (!existing) {
        return null;
      }
      const updated: ApiKeyRecord = {
        ...existing,
        enabled,
        updatedAt: new Date(),
      };
      rowsById.set(id, updated);
      return updated;
    },

    async updateLastUsedAt(id: string, at: Date): Promise<void> {
      const existing = rowsById.get(id);
      if (!existing) {
        return;
      }
      rowsById.set(id, {
        ...existing,
        lastUsedAt: at,
        updatedAt: new Date(),
      });
    },

    async delete(id: string): Promise<boolean> {
      return rowsById.delete(id);
    },
  };
}

export function createProvidersRepositoryMock() {
  const rows = new Map<string, ProviderRecord>();
  let idCounter = 1;

  return {
    async findByName(name: string): Promise<ProviderRecord | null> {
      return rows.get(name) ?? null;
    },

    async list(): Promise<ProviderRecord[]> {
      return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
    },

    async create(data: {
      name: string;
      isDefault?: boolean;
      provider?: string | null;
      baseUrl?: string | null;
      apiKey?: string | null;
      secretRef?: string | null;
    }): Promise<ProviderRecord> {
      const now = new Date();
      const row: ProviderRecord = {
        id: `cred_${idCounter++}`,
        name: data.name,
        isDefault: data.isDefault ?? false,
        provider: data.provider ?? null,
        baseUrl: data.baseUrl ?? null,
        apiKey: data.apiKey ?? null,
        secretRef: data.secretRef ?? null,
        createdAt: now,
        updatedAt: now,
      };
      rows.set(row.name, row);
      return row;
    },

    async update(
      name: string,
      data: Partial<{
        name: string;
        isDefault: boolean;
        provider: string | null;
        baseUrl: string | null;
        apiKey: string | null;
        secretRef: string | null;
      }>,
    ): Promise<ProviderRecord | null> {
      const existing = rows.get(name);
      if (!existing) {
        return null;
      }

      const updated: ProviderRecord = {
        ...existing,
        ...data,
        name: data.name ?? existing.name,
        updatedAt: new Date(),
      };
      if (updated.name !== name) {
        rows.delete(name);
      }
      rows.set(updated.name, updated);
      return updated;
    },

    async delete(name: string): Promise<boolean> {
      return rows.delete(name);
    },
  };
}

export function createSettingsRepositoryMock() {
  const rows = new Map<string, ModelProxySettingRecord>();
  let idCounter = 1;

  return {
    async findByKey(key: string): Promise<ModelProxySettingRecord | null> {
      return rows.get(key) ?? null;
    },

    async list(): Promise<ModelProxySettingRecord[]> {
      return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key));
    },

    async upsert(
      key: string,
      value: unknown,
    ): Promise<ModelProxySettingRecord> {
      const existing = rows.get(key);
      const now = new Date();
      const row: ModelProxySettingRecord = existing
        ? { ...existing, value, updatedAt: now }
        : {
            id: `setting_${idCounter++}`,
            key,
            value,
            createdAt: now,
            updatedAt: now,
          };
      rows.set(key, row);
      return row;
    },

    async deleteByKey(key: string): Promise<boolean> {
      return rows.delete(key);
    },
  };
}

export function createModelsRepositoryMock() {
  const rows = new Map<string, ModelProxyModelRecord>();
  let idCounter = 1;

  const createRow = (
    modelName: string,
    route: Partial<ModelProxyModelRecord> = {},
  ): ModelProxyModelRecord => {
    const now = new Date();
    return {
      id: `model_${idCounter++}`,
      modelId: modelName,
      enabled: route.enabled ?? true,
      displayName: route.displayName ?? null,
      family: route.family ?? null,
      canonicalSlug: route.canonicalSlug ?? null,
      description: route.description ?? null,
      contextLength: route.contextLength ?? null,
      maxCompletionTokens: route.maxCompletionTokens ?? null,
      knowledgeCutoff: route.knowledgeCutoff ?? null,
      expirationDate: route.expirationDate ?? null,
      architecture: route.architecture ?? null,
      reasoning: route.reasoning ?? null,
      supportedParameters: route.supportedParameters ?? null,
      defaultParameters: route.defaultParameters ?? null,
      perRequestLimits: route.perRequestLimits ?? null,
      pricing: route.pricing ?? null,
      requestOptions: route.requestOptions ?? null,
      providerId: route.providerId ?? null,
      reasoningApiId: route.reasoningApiId ?? null,
      createdAt: now,
      updatedAt: now,
    };
  };

  return {
    async findByModelName(
      modelName: string,
    ): Promise<ModelProxyModelRecord | null> {
      return rows.get(modelName) ?? null;
    },

    async list(options: { enabledOnly?: boolean } = {}) {
      return [...rows.values()]
        .filter((row) => !options.enabledOnly || row.enabled)
        .sort((a, b) => a.modelId.localeCompare(b.modelId));
    },

    async findProviderNameById(_providerId: string): Promise<string | null> {
      return null;
    },

    async setEnabled(
      modelName: string,
      enabled: boolean,
    ): Promise<ModelProxyModelRecord | null> {
      const existing = rows.get(modelName);
      if (!existing) {
        return null;
      }
      const updated: ModelProxyModelRecord = {
        ...existing,
        enabled,
        updatedAt: new Date(),
      };
      rows.set(modelName, updated);
      return updated;
    },

    async delete(idOrModelName: string): Promise<boolean> {
      for (const [modelName, row] of rows.entries()) {
        if (row.id === idOrModelName || modelName === idOrModelName) {
          return rows.delete(modelName);
        }
      }
      return false;
    },

    // Aliases used by RegistryModelsService
    createModel: async (
      modelName: string,
      route: Partial<ModelProxyModelRecord> = {},
    ) => {
      const existing = rows.get(modelName);
      if (existing) {
        throw new Error(`Model "${modelName}" already exists`);
      }
      const row = createRow(modelName, route);
      rows.set(modelName, row);
      return row;
    },

    updateModel: async (
      modelName: string,
      route: Partial<ModelProxyModelRecord>,
    ) => {
      const existing = rows.get(modelName);
      if (!existing) {
        return null;
      }
      const updated: ModelProxyModelRecord = {
        ...existing,
        ...route,
        updatedAt: new Date(),
      };
      rows.set(modelName, updated);
      return updated;
    },

    upsertModel: async (
      modelName: string,
      route: Partial<ModelProxyModelRecord> = {},
    ) => {
      const existing = rows.get(modelName);
      if (existing) {
        const updated: ModelProxyModelRecord = {
          ...existing,
          ...route,
          updatedAt: new Date(),
        };
        rows.set(modelName, updated);
        return updated;
      }
      const row = createRow(modelName, route);
      rows.set(modelName, row);
      return row;
    },
  };
}
