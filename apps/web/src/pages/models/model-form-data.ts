export type ModelFormData = {
  modelName: string;
  apiBase: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  extraParams: Record<string, string>;
};

export const FIXED_KEYS = [
  'api_base',
  'input_cost_per_token',
  'output_cost_per_token',
];

export const EMPTY_MODEL_FORM_DATA: ModelFormData = {
  modelName: '',
  apiBase: '',
  inputCostPerToken: '',
  outputCostPerToken: '',
  extraParams: {},
};
