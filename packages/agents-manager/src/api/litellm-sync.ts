// ── LiteLLM Model Sync ──
// Syncs real models from db.json to LiteLLM proxy.

import type { DbModelSpec } from "../types/index.js";
import { getStorage } from "./singleton.js";

export interface LiteLLMSyncOptions {
  skipSync?: boolean;
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

function isLikelyNotFoundError(status: number, errorText: string): boolean {
  if (status === 404) {
    return true;
  }
  if (status !== 400) {
    return false;
  }
  return /not found|no row|does not exist|missing/i.test(errorText);
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

function getLiteLLMCredentialName(): string | undefined {
  const credentialName = process.env.LITELLM_CREDENTIAL_NAME?.trim();
  return credentialName ? credentialName : undefined;
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
    custom_llm_provider: "litellm_proxy",
    use_litellm_proxy: false,
    use_in_pass_through: false,
    merge_reasoning_content_in_choices: false,
    context_window_size: spec.contextLength,
    max_tokens: spec.maxOutput,
  };

  if (inputCostPerToken !== undefined) {
    litellmParams.input_cost_per_token = inputCostPerToken;
  }
  if (outputCostPerToken !== undefined) {
    litellmParams.output_cost_per_token = outputCostPerToken;
  }

  const litellmCredentialName = getLiteLLMCredentialName();
  if (litellmCredentialName) {
    litellmParams.litellm_credential_name = litellmCredentialName;
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

async function postModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  endpoint: "/model/new" | "/model/update",
  payload: LiteLLMUpsertPayload,
): Promise<Response> {
  const trimmedBaseUrl = baseUrl.replace(/\/$/, "");
  const urls = [`${trimmedBaseUrl}${endpoint}`];
  if (trimmedBaseUrl.endsWith("/v1")) {
    urls.push(`${trimmedBaseUrl.slice(0, -3)}${endpoint}`);
  }

  let lastResponse: Response | null = null;
  for (const url of urls) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status !== 404) {
      return response;
    }
    lastResponse = response;
  }

  return lastResponse as Response;
}

async function upsertModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  payload: LiteLLMUpsertPayload,
): Promise<void> {
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
  if (!isLikelyNotFoundError(updateResponse.status, updateErrorText)) {
    throw new Error(
      `Failed to update model "${payload.model_name}": ${updateResponse.status} ${updateErrorText}`,
    );
  }

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
  if (isLikelyAlreadyExistsError(createResponse.status, createErrorText)) {
    const retryUpdateResponse = await postModelToLiteLLM(
      baseUrl,
      apiKey,
      "/model/update",
      payload,
    );
    if (retryUpdateResponse.ok) {
      return;
    }

    const retryUpdateErrorText = await retryUpdateResponse
      .text()
      .catch(() => "Unknown error");
    throw new Error(
      `Failed to update model "${payload.model_name}" after create conflict: ${retryUpdateResponse.status} ${retryUpdateErrorText}`,
    );
  }

  throw new Error(
    `Failed to create model "${payload.model_name}": ${createResponse.status} ${createErrorText}`,
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

  let synced = 0;
  const total = modelPayloads.length;
  const errors: Array<{ model: string; error: string }> = [];

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
        model: payload.model_name,
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

  console.log(`[agents-manager] Synced ${synced}/${total} models to LiteLLM`);
  return synced;
}
