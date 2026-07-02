import type { ModelConfig, ModelRoute } from "@/shared/lib/api-client/models";
import { resolveModelRoute } from "@/shared/lib/api-client/models";
import { FIXED_KEYS, type ModelFormData } from "./model-form-data";

const NUMERIC_PARAM_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Coerce a form string into a JSON-friendly route option value. */
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
  const route = resolveModelRoute(model);
  const extraParams: Record<string, string> = {};

  Object.entries(route.requestOptions ?? {}).forEach(([key, value]) => {
    if (!FIXED_KEYS.includes(key)) {
      extraParams[key] = String(value ?? "");
    }
  });

  return {
    modelName: model.modelName,
    apiBase: route.upstreamBaseUrl ?? "",
    inputCostPerToken: route.inputCostPerToken?.toString() || "",
    outputCostPerToken: route.outputCostPerToken?.toString() || "",
    contextWindowSize: route.contextWindowSize?.toString() || "",
    maxTokens: route.maxOutputTokens?.toString() || "",
    providerName: route.providerName ?? "",
    extraParams,
    enabled: route.enabled ?? true,
  };
}

export function validateAndBuildModelRoute(formData: ModelFormData): {
  route: ModelRoute;
  error?: string;
} {
  if (!formData.modelName.trim()) {
    return { route: { modelName: "" }, error: "Model name is required" };
  }

  const inputCost = formData.inputCostPerToken
    ? parseFloat(formData.inputCostPerToken)
    : 0;
  const outputCost = formData.outputCostPerToken
    ? parseFloat(formData.outputCostPerToken)
    : 0;

  if (formData.inputCostPerToken && Number.isNaN(inputCost)) {
    return {
      route: { modelName: formData.modelName },
      error: "Input cost must be a valid number",
    };
  }
  if (formData.outputCostPerToken && Number.isNaN(outputCost)) {
    return {
      route: { modelName: formData.modelName },
      error: "Output cost must be a valid number",
    };
  }

  const contextWindow = formData.contextWindowSize
    ? parseInt(formData.contextWindowSize, 10)
    : 0;
  const maxTokens = formData.maxTokens ? parseInt(formData.maxTokens, 10) : 0;

  if (formData.contextWindowSize && Number.isNaN(contextWindow)) {
    return {
      route: { modelName: formData.modelName },
      error: "Context window must be a valid number",
    };
  }
  if (formData.maxTokens && Number.isNaN(maxTokens)) {
    return {
      route: { modelName: formData.modelName },
      error: "Max tokens must be a valid number",
    };
  }

  const requestOptions: Record<string, unknown> = {};
  Object.entries(formData.extraParams).forEach(([key, value]) => {
    const parsed = parseExtraParamValue(value);
    if (parsed !== undefined) {
      requestOptions[key] = parsed;
    }
  });

  const route: ModelRoute = {
    modelName: formData.modelName.trim(),
    enabled: formData.enabled,
  };

  if (formData.apiBase.trim()) {
    route.upstreamBaseUrl = formData.apiBase.trim();
  }
  if (inputCost > 0) {
    route.inputCostPerToken = inputCost;
  }
  if (outputCost > 0) {
    route.outputCostPerToken = outputCost;
  }
  if (contextWindow > 0) {
    route.contextWindowSize = contextWindow;
  }
  if (maxTokens > 0) {
    route.maxOutputTokens = maxTokens;
  }
  if (formData.providerName.trim()) {
    route.providerName = formData.providerName.trim();
  }
  if (Object.keys(requestOptions).length > 0) {
    route.requestOptions = requestOptions;
  }

  return { route };
}
