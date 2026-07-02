/**
 * Structured model routing config for `model_proxy_models`.
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
  providerName?: string;
  /** Env var name holding upstream API key for this model (MVP). */
  secretRef?: string;
  /** Provider-specific kwargs not mapped to dedicated columns. */
  requestOptions?: Record<string, unknown>;
  /** Extra dashboard-facing metadata (thinking, reasoning) outside first-class registry columns. */
  metadata?: Record<string, unknown>;
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
  providerName: string | null;
  secretRef: string | null;
  requestOptions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Snake_case route param object (import / API compatibility). */
export type RouteParams = Record<string, unknown>;

/**
 * Keys absorbed into dedicated `ModelProxyModel` columns.
 * All other keys → `requestOptions`.
 */
export const RESERVED_ROUTE_PARAM_KEYS = [
  "model",
  "model_name",
  "enabled",
  "input_cost_per_token",
  "output_cost_per_token",
  "context_window_size",
  "max_tokens",
  "provider_name",
  "litellm_provider_name",
  "api_base",
  "custom_llm_provider",
] as const;

export type ReservedRouteParamKey = (typeof RESERVED_ROUTE_PARAM_KEYS)[number];

/** snake_case route params → camelCase ModelRoute field */
export const ROUTE_PARAM_TO_MODEL_ROUTE: Record<
  ReservedRouteParamKey,
  keyof ModelRoute | "modelName"
> = {
  model: "modelName",
  model_name: "modelName",
  enabled: "enabled",
  input_cost_per_token: "inputCostPerToken",
  output_cost_per_token: "outputCostPerToken",
  context_window_size: "contextWindowSize",
  max_tokens: "maxOutputTokens",
  provider_name: "providerName",
  litellm_provider_name: "providerName",
  api_base: "upstreamBaseUrl",
  custom_llm_provider: "ownedBy",
};

/** camelCase ModelRoute → snake_case route params. */
export const MODEL_ROUTE_TO_SNAKE_PARAM: Partial<
  Record<keyof ModelRoute, string>
> = {
  modelName: "model",
  enabled: "enabled",
  inputCostPerToken: "input_cost_per_token",
  outputCostPerToken: "output_cost_per_token",
  contextWindowSize: "context_window_size",
  maxOutputTokens: "max_tokens",
  providerName: "provider_name",
  upstreamBaseUrl: "api_base",
  ownedBy: "custom_llm_provider",
  family: "custom_llm_provider",
};
