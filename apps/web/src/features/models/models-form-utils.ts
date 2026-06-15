import type { ModelConfig } from "@/shared/lib/api-client/models";
import { FIXED_KEYS, type ModelFormData } from "./model-form-data";

const NUMERIC_PARAM_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Coerce a form string into a JSON-friendly LiteLLM param value. */
export function parseExtraParamValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "true") {
    return true;
  }
  if (lower === "false") {
    return false;
  }

  if (NUMERIC_PARAM_PATTERN.test(trimmed)) {
    const num = Number(trimmed);
    if (Number.isFinite(num)) {
      return num;
    }
  }

  return trimmed;
}

export function mapModelToFormData(model: ModelConfig): ModelFormData {
  const params = model.litellmParams || {};
  const extraParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (!FIXED_KEYS.includes(key)) {
      extraParams[key] = String(value ?? "");
    }
  });

  return {
    modelName: model.modelName,
    apiBase: (params.api_base as string) || "",
    inputCostPerToken: params.input_cost_per_token?.toString() || "",
    outputCostPerToken: params.output_cost_per_token?.toString() || "",
    contextWindowSize: params.context_window_size?.toString() || "",
    maxTokens: params.max_tokens?.toString() || "",
    litellmCredentialName: (params.litellm_credential_name as string) || "",
    extraParams,
    enabled: (params.enabled as boolean) ?? true,
  };
}

export function validateAndBuildModelParams(formData: ModelFormData): {
  params: Record<string, unknown>;
  error?: string;
} {
  if (!formData.modelName.trim()) {
    return { params: {}, error: "Model name is required" };
  }

  const inputCost = formData.inputCostPerToken
    ? parseFloat(formData.inputCostPerToken)
    : 0;
  const outputCost = formData.outputCostPerToken
    ? parseFloat(formData.outputCostPerToken)
    : 0;

  if (formData.inputCostPerToken && Number.isNaN(inputCost)) {
    return { params: {}, error: "Input cost must be a valid number" };
  }
  if (formData.outputCostPerToken && Number.isNaN(outputCost)) {
    return { params: {}, error: "Output cost must be a valid number" };
  }

  const contextWindow = formData.contextWindowSize
    ? parseInt(formData.contextWindowSize, 10)
    : 0;
  const maxTokens = formData.maxTokens ? parseInt(formData.maxTokens, 10) : 0;

  if (formData.contextWindowSize && Number.isNaN(contextWindow)) {
    return { params: {}, error: "Context window must be a valid number" };
  }
  if (formData.maxTokens && Number.isNaN(maxTokens)) {
    return { params: {}, error: "Max tokens must be a valid number" };
  }

  const params: Record<string, unknown> = {};
  if (formData.apiBase.trim()) {
    params.api_base = formData.apiBase.trim();
  }
  if (inputCost > 0) {
    params.input_cost_per_token = inputCost;
  }
  if (outputCost > 0) {
    params.output_cost_per_token = outputCost;
  }
  if (contextWindow > 0) {
    params.context_window_size = contextWindow;
  }
  if (maxTokens > 0) {
    params.max_tokens = maxTokens;
  }
  if (formData.litellmCredentialName.trim()) {
    params.litellm_credential_name = formData.litellmCredentialName.trim();
  }

  Object.entries(formData.extraParams).forEach(([key, value]) => {
    const parsed = parseExtraParamValue(value);
    if (parsed !== undefined) {
      params[key] = parsed;
    }
  });

  params.enabled = formData.enabled;

  return { params };
}
