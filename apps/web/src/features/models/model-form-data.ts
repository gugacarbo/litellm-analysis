export type ModelFormData = {
  modelName: string;
  apiBase: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  contextWindowSize: string;
  maxTokens: string;
  credentialName: string;
  extraParams: Record<string, string>;
  enabled: boolean;
};

export const FIXED_KEYS = [
  "api_base",
  "input_cost_per_token",
  "output_cost_per_token",
  "context_window_size",
  "max_tokens",
  "credential_name",
  "enabled",
];

export const EMPTY_MODEL_FORM_DATA: ModelFormData = {
  modelName: "",
  apiBase: "",
  inputCostPerToken: "",
  outputCostPerToken: "",
  contextWindowSize: "",
  maxTokens: "",
  credentialName: "",
  extraParams: {},
  enabled: true,
};
