export type ModelFormData = {
  modelName: string;
  apiBase: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  contextWindowSize: string;
  maxTokens: string;
  providerName: string;
  extraParams: Record<string, string>;
  enabled: boolean;
};

export const FIXED_KEYS = [
  "input_cost_per_token",
  "output_cost_per_token",
  "context_window_size",
  "max_tokens",
  "enabled",
];

export const EMPTY_MODEL_FORM_DATA: ModelFormData = {
  modelName: "",
  apiBase: "",
  inputCostPerToken: "",
  outputCostPerToken: "",
  contextWindowSize: "",
  maxTokens: "",
  providerName: "",
  extraParams: {},
  enabled: true,
};
