/**
 * Structured model routing config — replaces legacy `litellmParams` in new code.
 * Maps 1:1 to `model_proxy_models` columns + `requestOptions` JSON.
 *
 * @see docs/batch-3-field-mapping.md
 */

/** API / adapter mode for consumer-facing model metadata. */
export type ModelApiMode = "openai" | "anthropic";

/**
 * Canonical routing record for a managed model alias.
 * First-class fields correspond to Prisma `ModelProxyModel` columns.
 */
export interface ModelRoute {
  /** Public alias / route name (unique). */
  modelName: string;
  enabled?: boolean;
  displayName?: string;
  family?: string;
  ownedBy?: string;
  apiMode?: ModelApiMode;
  vision?: boolean;
  contextWindowSize?: number;
  maxOutputTokens?: number;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  upstreamModel?: string;
  upstreamBaseUrl?: string;
  credentialName?: string;
  /** Env var name holding upstream API key for this model (MVP). */
  secretRef?: string;
  /**
   * Provider-specific and legacy LiteLLM kwargs not mapped to dedicated columns.
   * Keys remain snake_case when imported from `litellmParams`.
   */
  requestOptions?: Record<string, unknown>;
}

/** Subset of `ModelRoute` writable on create/update (excludes identity). */
export type ModelRouteUpdate = Partial<Omit<ModelRoute, "modelName">>;

/**
 * Registry row shape aligned with Prisma `ModelProxyModel`.
 * Used by repositories before/after DB round-trip.
 */
export interface ModelProxyModelRecord {
  id: string;
  modelName: string;
  enabled: boolean;
  displayName: string | null;
  family: string | null;
  ownedBy: string | null;
  apiMode: string | null;
  vision: boolean | null;
  contextWindowSize: number | null;
  maxOutputTokens: number | null;
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
  upstreamModel: string | null;
  upstreamBaseUrl: string | null;
  credentialName: string | null;
  secretRef: string | null;
  requestOptions: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Legacy LiteLLM `litellm_params` JSON object (snake_case keys). */
export type LegacyLitellmParams = Record<string, unknown>;

/**
 * Keys absorbed into dedicated `ModelProxyModel` columns during import.
 * All other `litellmParams` keys → `requestOptions`.
 */
export const RESERVED_LITELLM_PARAM_KEYS = [
  "model",
  "model_name",
  "enabled",
  "input_cost_per_token",
  "output_cost_per_token",
  "context_window_size",
  "max_tokens",
  "litellm_credential_name",
  "api_base",
  "custom_llm_provider",
] as const;

export type ReservedLitellmParamKey =
  (typeof RESERVED_LITELLM_PARAM_KEYS)[number];

/** snake_case litellmParams → camelCase ModelRoute field */
export const LITELLM_PARAM_TO_MODEL_ROUTE: Record<
  ReservedLitellmParamKey,
  keyof ModelRoute | "modelName"
> = {
  model: "modelName",
  model_name: "modelName",
  enabled: "enabled",
  input_cost_per_token: "inputCostPerToken",
  output_cost_per_token: "outputCostPerToken",
  context_window_size: "contextWindowSize",
  max_tokens: "maxOutputTokens",
  litellm_credential_name: "credentialName",
  api_base: "upstreamBaseUrl",
  custom_llm_provider: "ownedBy",
};

/** camelCase ModelRoute → snake_case litellmParams (legacy export shim). */
export const MODEL_ROUTE_TO_LITELLM_PARAM: Partial<
  Record<keyof ModelRoute, string>
> = {
  modelName: "model",
  enabled: "enabled",
  inputCostPerToken: "input_cost_per_token",
  outputCostPerToken: "output_cost_per_token",
  contextWindowSize: "context_window_size",
  maxOutputTokens: "max_tokens",
  credentialName: "litellm_credential_name",
  upstreamBaseUrl: "api_base",
  ownedBy: "custom_llm_provider",
  family: "custom_llm_provider",
};
