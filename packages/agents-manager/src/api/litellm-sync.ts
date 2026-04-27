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

async function postModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  endpoint: "/model/new" | "/model/update",
  aliasName: string,
  actualModel: string,
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, "")}${endpoint}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model_name: aliasName,
      litellm_params: {
        model: actualModel,
      },
    }),
  });
}

async function upsertModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  aliasName: string,
  actualModel: string,
): Promise<void> {
  const createResponse = await postModelToLiteLLM(
    baseUrl,
    apiKey,
    "/model/new",
    aliasName,
    actualModel,
  );
  if (createResponse.ok) {
    return;
  }

  const createErrorText = await createResponse
    .text()
    .catch(() => "Unknown error");
  if (!isLikelyAlreadyExistsError(createResponse.status, createErrorText)) {
    throw new Error(
      `Failed to create alias ${aliasName} -> ${actualModel}: ${createResponse.status} ${createErrorText}`,
    );
  }

  const updateResponse = await postModelToLiteLLM(
    baseUrl,
    apiKey,
    "/model/update",
    aliasName,
    actualModel,
  );
  if (updateResponse.ok) {
    return;
  }

  const updateErrorText = await updateResponse
    .text()
    .catch(() => "Unknown error");
  throw new Error(
    `Failed to update alias ${aliasName} -> ${actualModel}: ${updateResponse.status} ${updateErrorText}`,
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

  const aliases = extractAllAliasesFromConfig(config);
  let synced = 0;
  const errors: Array<{ alias: string; error: string }> = [];

  for (const [aliasName, actualModel] of aliases) {
    try {
      await upsertModelToLiteLLM(
        config.litellm.baseUrl,
        config.litellm.apiKey,
        aliasName,
        actualModel,
      );
      synced++;
    } catch (error) {
      errors.push({
        alias: aliasName,
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
    `[agents-manager] Synced ${synced}/${aliases.length} aliases to LiteLLM`,
  );
  return synced;
}
