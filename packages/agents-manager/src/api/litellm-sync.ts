// ── LiteLLM Model Sync ──
// Registers agent/category aliases to LiteLLM proxy with real model targets.

import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/alias-router";
import type {
  DbAgentEntry,
  DbCategoryEntry,
  DbConfig,
  DbModelSpec,
} from "../types/index.js";
import { getStorage } from "./singleton.js";

export interface LiteLLMSyncOptions {
  skipSync?: boolean;
}

function addEntityAliases(
  entities: Record<string, DbAgentEntry | DbCategoryEntry>,
  globalFallbackModel: string | undefined,
  aliases: Record<string, string>,
): void {
  for (const [key, entry] of Object.entries(entities)) {
    if (Object.keys(entry).length === 0) continue;

    const generated = generateLitellmAliases(
      key,
      entry.model || "",
      entry.fallbackModels,
      globalFallbackModel,
    );
    Object.assign(aliases, generated);
  }
}

function extractAllAliasesFromConfig(
  config: DbConfig,
): Array<[string, string]> {
  const mergedAliases: Record<string, string> = {
    ...(config.customAliases || {}),
  };

  addEntityAliases(config.agents, config.globalFallbackModel, mergedAliases);
  addEntityAliases(
    config.categories,
    config.globalFallbackModel,
    mergedAliases,
  );

  const sortedAliases = sortAliasesByDefinitionOrder(mergedAliases);
  return Object.entries(sortedAliases).filter(([, model]) => Boolean(model));
}

function isLikelyAlreadyExistsError(
  status: number,
  errorText: string,
): boolean {
  if (status === 409) {
    return true;
  }
  if (status !== 400) {
    return false;
  }
  return /already exists|already registered|duplicate|exists/i.test(errorText);
}

interface LiteLLMUpsertPayload {
  model_name: string;
  litellm_params: Record<string, unknown>;
  model_info?: Record<string, unknown>;
}

function toCostPerToken(costPerMillion?: number): number | undefined {
  if (typeof costPerMillion !== "number" || Number.isNaN(costPerMillion)) {
    return undefined;
  }
  return costPerMillion / 1_000_000;
}

function buildModelUpsertPayload(
  modelName: string,
  spec: DbModelSpec,
): LiteLLMUpsertPayload {
  const inputCostPerToken = toCostPerToken(spec.cost?.input);
  const outputCostPerToken = toCostPerToken(spec.cost?.output);

  const litellmParams: Record<string, unknown> = {
    model: modelName,
    model_name: modelName,
    context_window_size: spec.contextLength,
    max_tokens: spec.maxOutput,
  };

  if (inputCostPerToken !== undefined) {
    litellmParams.input_cost_per_token = inputCostPerToken;
  }
  if (outputCostPerToken !== undefined) {
    litellmParams.output_cost_per_token = outputCostPerToken;
  }

  const modelInfo: Record<string, unknown> = {
    max_tokens: spec.maxOutput,
    max_input_tokens: spec.contextLength,
    max_output_tokens: spec.maxOutput,
  };

  if (inputCostPerToken !== undefined) {
    modelInfo.input_cost_per_token = inputCostPerToken;
  }
  if (outputCostPerToken !== undefined) {
    modelInfo.output_cost_per_token = outputCostPerToken;
  }

  return {
    model_name: modelName,
    litellm_params: litellmParams,
    model_info: modelInfo,
  };
}

function buildAliasUpsertPayload(
  aliasName: string,
  actualModel: string,
): LiteLLMUpsertPayload {
  return {
    model_name: aliasName,
    litellm_params: {
      model: actualModel,
    },
  };
}

async function postModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  endpoint: "/model/new" | "/model/update",
  payload: LiteLLMUpsertPayload,
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, "")}${endpoint}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
}

async function upsertModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  payload: LiteLLMUpsertPayload,
): Promise<void> {
  const createResponse = await postModelToLiteLLM(
    baseUrl,
    apiKey,
    "/model/new",
    payload,
  );
  if (createResponse.ok) {
    return;
  }

  const createErrorText = await createResponse
    .text()
    .catch(() => "Unknown error");
  if (!isLikelyAlreadyExistsError(createResponse.status, createErrorText)) {
    throw new Error(
      `Failed to create model "${payload.model_name}": ${createResponse.status} ${createErrorText}`,
    );
  }

  const updateResponse = await postModelToLiteLLM(
    baseUrl,
    apiKey,
    "/model/update",
    payload,
  );
  if (updateResponse.ok) {
    return;
  }

  const updateErrorText = await updateResponse
    .text()
    .catch(() => "Unknown error");
  throw new Error(
    `Failed to update model "${payload.model_name}": ${updateResponse.status} ${updateErrorText}`,
  );
}

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

  if (!config.litellm?.baseUrl || !config.litellm?.apiKey) {
    console.warn(
      "[agents-manager] No LiteLLM configuration found, skipping sync",
    );
    return 0;
  }

  const modelPayloads = Object.entries(config.models || {}).map(
    ([modelName, spec]) => buildModelUpsertPayload(modelName, spec),
  );
  const modelNames = new Set(
    modelPayloads.map((payload) => payload.model_name),
  );
  const aliasPayloads = extractAllAliasesFromConfig(config)
    .filter(([aliasName]) => !modelNames.has(aliasName))
    .map(([aliasName, actualModel]) =>
      buildAliasUpsertPayload(aliasName, actualModel),
    );

  let synced = 0;
  const total = modelPayloads.length + aliasPayloads.length;
  const errors: Array<{ alias: string; error: string }> = [];

  for (const payload of modelPayloads) {
    try {
      await upsertModelToLiteLLM(
        config.litellm.baseUrl,
        config.litellm.apiKey,
        payload,
      );
      synced++;
    } catch (error) {
      errors.push({
        alias: payload.model_name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const payload of aliasPayloads) {
    try {
      await upsertModelToLiteLLM(
        config.litellm.baseUrl,
        config.litellm.apiKey,
        payload,
      );
      synced++;
    } catch (error) {
      errors.push({
        alias: payload.model_name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (errors.length > 0) {
    console.error(
      `[agents-manager] Failed to sync ${errors.length} aliases to LiteLLM:`,
      errors,
    );
  }

  console.log(
    `[agents-manager] Synced ${synced}/${total} models/aliases to LiteLLM`,
  );
  return synced;
}
