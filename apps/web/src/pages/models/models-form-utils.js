import { FIXED_KEYS } from "./model-form-data";
export function mapModelToFormData(model) {
  const params = model.litellmParams || {};
  const extraParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (!FIXED_KEYS.includes(key)) {
      extraParams[key] = String(value ?? "");
    }
  });
  return {
    modelName: model.modelName,
    apiBase: params.api_base || "",
    inputCostPerToken: params.input_cost_per_token?.toString() || "",
    outputCostPerToken: params.output_cost_per_token?.toString() || "",
    contextWindowSize: params.context_window_size?.toString() || "",
    maxTokens: params.max_tokens?.toString() || "",
    litellmCredentialName: params.litellm_credential_name || "",
    extraParams,
  };
}
export function validateAndBuildModelParams(formData) {
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
  const params = {};
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
    if (value.trim()) {
      const num = parseFloat(value);
      params[key] = !Number.isNaN(num) ? num : value.trim();
    }
  });
  return { params };
}
