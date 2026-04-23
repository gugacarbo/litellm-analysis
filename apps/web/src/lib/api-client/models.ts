import { fetchApi } from './core';

export type ModelConfig = {
  modelName: string;
  litellmParams: Record<string, unknown>;
};

export async function getAllModels(): Promise<ModelConfig[]> {
  return fetchApi('/models');
}

export async function createModel(
  model: ModelConfig,
): Promise<{ success: boolean }> {
  return fetchApi('/models', {
    method: 'POST',
    body: JSON.stringify(model),
  });
}

export async function updateModel(
  modelName: string,
  litellmParams: Record<string, unknown>,
  newName?: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: 'PUT',
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
    method: 'DELETE',
  });
}

export async function deleteModelLogs(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/logs/${encodeURIComponent(modelName)}`, {
    method: 'DELETE',
  });
}

export async function mergeModels(
  sourceModel: string,
  targetModel: string,
): Promise<{ success: boolean }> {
  return fetchApi('/models/merge', {
    method: 'POST',
    body: JSON.stringify({ sourceModel, targetModel }),
  });
}
