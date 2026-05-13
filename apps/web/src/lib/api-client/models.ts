import { fetchApi } from "./core";

export type ModelConfig = {
  modelName: string;
  litellmParams: Record<string, unknown>;
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

export async function addModelToConfig(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi("/models/add-to-config", {
    method: "POST",
    body: JSON.stringify({ modelName }),
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
