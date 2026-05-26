import { fetchApi } from "./core";

export type ModelConfig = {
  modelName: string;
  litellmParams: Record<string, unknown>;
  enabled?: boolean;
};

export type ModelWithStatus = ModelConfig & {
  status: "synced" | "config-only" | "litellm-only";
};

export type ModelsWithConfigResponse = {
  models: ModelWithStatus[];
  counts: {
    synced: number;
    configOnly: number;
    litellmOnly: number;
    total: number;
  };
};

export type SyncDirection = "config-to-litellm" | "litellm-to-config";

export type SyncField =
  | "model_presence"
  | "enabled"
  | "context_window_size"
  | "max_tokens"
  | "input_cost_per_token"
  | "output_cost_per_token";

export type ModelSyncDiffItem = {
  modelName: string;
  field: SyncField;
  configValue: unknown;
  litellmValue: unknown;
  defaultDirection: SyncDirection;
};

export type ModelSyncSelection = {
  modelName: string;
  field: SyncField;
  direction: SyncDirection;
};

export type ModelProviderConfig = {
  name: string;
  ownedBy: string;
  baseUrl: string;
  apiKey: string;
  defaultCredential: string;
};

export type DefaultSettingsDiffResponse = {
  defaultCredential: string;
  mismatchedModels: string[];
  count: number;
};

export async function getAllModels(): Promise<ModelConfig[]> {
  return fetchApi("/models");
}

export async function createModel(
  model: ModelConfig,
): Promise<{ success: boolean }> {
  return fetchApi("/models", {
    method: "POST",
    body: JSON.stringify(model),
  });
}

export async function updateModel(
  modelName: string,
  litellmParams: Record<string, unknown>,
  newName?: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "PUT",
    body: JSON.stringify({
      litellmParams,
      ...(newName ? { modelName: newName } : {}),
    }),
  });
}

export async function deleteModel(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "DELETE",
  });
}

export async function deleteModelLogs(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/logs/${encodeURIComponent(modelName)}`, {
    method: "DELETE",
  });
}

export async function getModelsWithConfig(): Promise<ModelsWithConfigResponse> {
  return fetchApi("/models/with-config");
}

export async function syncModelsFromConfig(): Promise<{ success: boolean }> {
  return fetchApi("/models/sync-from-config", {
    method: "POST",
  });
}

export async function getModelsSyncDiff(): Promise<{
  items: ModelSyncDiffItem[];
}> {
  return fetchApi("/models/sync-diff");
}

export async function syncModelsBatch(
  selections: ModelSyncSelection[],
): Promise<{
  success: boolean;
  applied: number;
}> {
  return fetchApi("/models/sync-batch", {
    method: "POST",
    body: JSON.stringify({ selections }),
  });
}

export async function addModelToConfig(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi("/models/add-to-config", {
    method: "POST",
    body: JSON.stringify({ modelName }),
  });
}

export async function toggleModelEnabled(
  modelName: string,
  enabled: boolean,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "PUT",
    body: JSON.stringify({ litellmParams: { enabled } }),
  });
}

export async function mergeModels(
  sourceModel: string,
  targetModel: string,
): Promise<{ success: boolean }> {
  return fetchApi("/models/merge", {
    method: "POST",
    body: JSON.stringify({ sourceModel, targetModel }),
  });
}

export async function getModelProvider(
  providerId: string,
): Promise<ModelProviderConfig> {
  return fetchApi(`/models/providers/${encodeURIComponent(providerId)}`);
}

export async function updateModelProvider(
  providerId: string,
  updates: Partial<ModelProviderConfig>,
): Promise<ModelProviderConfig> {
  return fetchApi(`/models/providers/${encodeURIComponent(providerId)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function getDefaultSettingsDiff(): Promise<DefaultSettingsDiffResponse> {
  return fetchApi("/models/default-settings-diff");
}

export async function syncDefaultSettings(): Promise<{
  success: boolean;
  updated: number;
  defaultCredential: string;
}> {
  return fetchApi("/models/sync-default-settings", {
    method: "POST",
  });
}
