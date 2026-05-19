export type ModelFormData = {
  modelName: string;
  apiBase: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  contextWindowSize: string;
  maxTokens: string;
  litellmCredentialName: string;
  extraParams: Record<string, string>;
  enabled: boolean;
};

export const FIXED_KEYS = [
  "api_base",
  "input_cost_per_token",
  "output_cost_per_token",
  "context_window_size",
  "max_tokens",
  "litellm_credential_name",
  "enabled",
];

export const EMPTY_MODEL_FORM_DATA: ModelFormData = {
  modelName: "",
  apiBase: "",
  inputCostPerToken: "",
  outputCostPerToken: "",
  contextWindowSize: "",
  maxTokens: "",
  litellmCredentialName: "",
  extraParams: {},
  enabled: true,
};
