// ── LiteLLM Provider types ──

export interface LiteLLMModelConfig {
  id: string;
  name?: string;
  limit?: {
    output?: number;
    context?: number;
  };
  cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
  };
}

export interface OpenCodeProviderEntry {
  name?: string;
  npm: string;
  options?: {
    baseURL: string;
    apiKey: string;
  };
  models?: Record<string, LiteLLMModelConfig>;
}

export interface OpenCodeProviders {
  provider: Record<string, OpenCodeProviderEntry>;
  model_group_alias?: Record<string, string>;
}
