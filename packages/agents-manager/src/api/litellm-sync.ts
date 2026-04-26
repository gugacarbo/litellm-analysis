// ── LiteLLM Model Sync ──
// Automatically registers agent/category model aliases to LiteLLM proxy

import type { DbConfig } from "../types/index.js";
import { getStorage } from "./singleton.js";

export interface LiteLLMSyncOptions {
  /** Skip sync (useful for bulk writes) */
  skipSync?: boolean;
}

/**
 * Extracts all unique model names from agents and categories
 */
function extractModelsFromConfig(config: DbConfig): Set<string> {
  const models = new Set<string>();

  // Extract from agents
  for (const agent of Object.values(config.agents)) {
    if (agent.model) {
      models.add(agent.model);
    }
    if (agent.fallbackModels) {
      for (const fallback of agent.fallbackModels) {
        models.add(fallback);
      }
    }
  }

  // Extract from categories
  for (const category of Object.values(config.categories)) {
    if (category.model) {
      models.add(category.model);
    }
    if (category.fallbackModels) {
      for (const fallback of category.fallbackModels) {
        models.add(fallback);
      }
    }
  }

  // Add global fallback
  if (config.globalFallbackModel) {
    models.add(config.globalFallbackModel);
  }

  return models;
}

/**
 * Registers a model alias to the LiteLLM proxy via admin API
 */
async function registerModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  modelName: string,
): Promise<void> {
  // Use the model name as both the alias and the actual model
  // The LiteLLM proxy will route this to the configured backend
  const url = `${baseUrl.replace(/\/$/, "")}/model/new`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model_name: modelName,
      litellm_params: {
        model: modelName,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to register model ${modelName}: ${response.status} ${errorText}`,
    );
  }
}

/**
 * Syncs all agent/category model aliases to the LiteLLM proxy.
 *
 * Call this function after making changes to the agents/categories config
 * to ensure the models are registered with the LiteLLM proxy.
 *
 * @param options - Optional configuration
 * @returns The number of models synced
 */
export async function syncToLiteLLM(
  options?: LiteLLMSyncOptions,
): Promise<number> {
  if (options?.skipSync) {
    return 0;
  }

  const storage = getStorage();
  if (!storage) {
    console.warn("[agents-manager] Storage not initialized, skipping sync");
    return 0;
  }

  const config = await storage.read();

  // Skip if no LiteLLM config
  if (!config.litellm?.baseUrl || !config.litellm?.apiKey) {
    console.warn(
      "[agents-manager] No LiteLLM configuration found, skipping sync",
    );
    return 0;
  }

  const models = extractModelsFromConfig(config);
  let synced = 0;
  const errors: Array<{ model: string; error: string }> = [];

  for (const modelName of models) {
    try {
      await registerModelToLiteLLM(
        config.litellm.baseUrl,
        config.litellm.apiKey,
        modelName,
      );
      synced++;
    } catch (error) {
      errors.push({
        model: modelName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (errors.length > 0) {
    console.error(
      `[agents-manager] Failed to sync ${errors.length} models to LiteLLM:`,
      errors,
    );
  }

  console.log(
    `[agents-manager] Synced ${synced}/${models.size} models to LiteLLM`,
  );
  return synced;
}
