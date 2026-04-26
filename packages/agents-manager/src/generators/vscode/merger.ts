import type { DbModelSpec } from "../../types/index.js";
import { humanize } from "./model-builder.js";

export interface DbModelWithParams {
  modelName: string;
  litellmParams: Record<string, unknown> | null;
}

export function mergeModelsFromDb(
  existingModels: Record<string, DbModelSpec>,
  dbModels?: DbModelWithParams[],
): Record<string, DbModelSpec> {
  const merged: Record<string, DbModelSpec> = { ...existingModels };

  if (!dbModels || dbModels.length === 0) return merged;

  for (const m of dbModels) {
    const params = m.litellmParams || {};
    let modelId = m.modelName;

    if (modelId.startsWith("litellm/")) {
      modelId = modelId.slice(8);
    }
    if (params.model_name) {
      modelId = String(params.model_name);
    }

    merged[modelId] = {
      displayName: merged[modelId]?.displayName || humanize(modelId),
      ownedBy: merged[modelId]?.ownedBy || "atplus",
      family: merged[modelId]?.family,
      contextLength: params.context_window_size
        ? Number(params.context_window_size)
        : (merged[modelId]?.contextLength ?? 200000),
      maxOutput: params.max_tokens
        ? Number(params.max_tokens)
        : (merged[modelId]?.maxOutput ?? 32768),
    };
  }

  return merged;
}
