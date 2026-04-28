import {
  createModel,
  deleteModel,
  deleteModelLogs,
  getAllModels,
  getModelDetails,
  mergeModels,
  updateModel,
} from "../queries/index.js";
import type { ModelDetail, ModelEntry } from "../types/index.js";

export async function getModelsImpl(): Promise<ModelEntry[]> {
  const result = await getAllModels();
  return result.map((item) => ({
    modelName: item.modelName,
    litellmParams: item.litellmParams as Record<string, unknown> | null,
  }));
}

export async function getModelDetailsImpl(): Promise<ModelDetail[]> {
  const result = await getModelDetails();
  return result.map((item) => ({
    model_name: item.model_name,
    input_cost_per_token: item.input_cost_per_token as string | null,
    output_cost_per_token: item.output_cost_per_token as string | null,
  }));
}

export async function createModelImpl(model: {
  modelName: string;
  litellmParams: Record<string, unknown>;
}): Promise<void> {
  await createModel(model);
}

export async function updateModelImpl(
  modelName: string,
  updates: {
    litellmParams?: Record<string, unknown>;
    modelName?: string;
  },
): Promise<void> {
  await updateModel(modelName, updates);
}

export async function deleteModelImpl(modelName: string): Promise<void> {
  await deleteModel(modelName);
}

export async function mergeModelsImpl(
  sourceModel: string,
  targetModel: string,
): Promise<void> {
  await mergeModels(sourceModel, targetModel);
}

export async function deleteModelLogsImpl(modelName: string): Promise<void> {
  await deleteModelLogs(modelName);
}
