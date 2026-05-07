import { serverEnv } from "@lite-llm/env/server";
export function parseDays(rawValue, fallback) {
  if (typeof rawValue !== "string") {
    return fallback;
  }
  const MAX_DAYS = 365;
  const parsed = Number.parseFloat(rawValue);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, MAX_DAYS);
}
export function toCostPerToken(costPerMillion) {
  if (typeof costPerMillion !== "number" || Number.isNaN(costPerMillion)) {
    return undefined;
  }
  return costPerMillion / 1_000_000;
}
export function getLiteLLMCredentialName() {
  const credentialName = serverEnv.LITELLM_CREDENTIAL_NAME?.trim();
  return credentialName ? credentialName : undefined;
}
export function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function applyRequiredLiteLLMParams(modelName, litellmParams) {
  const nextParams = { ...litellmParams };
  nextParams.model = modelName;
  nextParams.model_name = modelName;
  nextParams.custom_llm_provider = "litellm_proxy";
  nextParams.use_litellm_proxy = false;
  nextParams.use_in_pass_through = false;
  nextParams.merge_reasoning_content_in_choices = false;
  const litellmCredentialName = getLiteLLMCredentialName();
  if (litellmCredentialName) {
    nextParams.litellm_credential_name = litellmCredentialName;
  }
  return nextParams;
}
export function buildLiteLLMParams(modelName, spec) {
  const litellmParams = applyRequiredLiteLLMParams(modelName, {
    model: modelName,
    model_name: modelName,
    context_window_size: spec.contextLength,
    max_tokens: spec.maxOutput,
  });
  const inputCostPerToken = toCostPerToken(spec.cost?.input);
  const outputCostPerToken = toCostPerToken(spec.cost?.output);
  if (inputCostPerToken !== undefined) {
    litellmParams.input_cost_per_token = inputCostPerToken;
  }
  if (outputCostPerToken !== undefined) {
    litellmParams.output_cost_per_token = outputCostPerToken;
  }
  return litellmParams;
}
