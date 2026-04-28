// ── LiteLLM Payload Construction ──

import type { DbModelSpec } from "../../types/index.js";

export interface LiteLLMUpsertPayload {
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

export function buildModelUpsertPayload(
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
