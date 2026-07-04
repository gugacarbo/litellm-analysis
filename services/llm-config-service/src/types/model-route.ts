/**
 * Structured model routing config for `model_proxy_models`.
 */

/** API / adapter mode for consumer-facing model metadata. */
export type ModelApiMode = "openai" | "anthropic";

/**
 * Canonical routing record for a managed model alias.
 * First-class fields correspond to `ModelProxyModel` columns.
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
 * Registry row shape aligned with `ModelProxyModel`.
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

/** Canonical model route payload object used by API helpers. */
export type RouteParams = Record<string, unknown>;

/**
 * Canonical route payload keys absorbed into dedicated `ModelRoute` fields.
 */
export const RESERVED_ROUTE_PARAM_KEYS = [
  "modelName",
  "enabled",
  "displayName",
  "family",
  "ownedBy",
  "apiMode",
  "vision",
  "contextWindowSize",
  "maxOutputTokens",
  "inputCostPerToken",
  "outputCostPerToken",
  "upstreamModel",
  "upstreamBaseUrl",
  "providerName",
  "secretRef",
  "requestOptions",
  "metadata",
] as const;

export type ReservedRouteParamKey = (typeof RESERVED_ROUTE_PARAM_KEYS)[number];

/** Canonical route params → `ModelRoute` field */
export const ROUTE_PARAM_TO_MODEL_ROUTE: Record<
  ReservedRouteParamKey,
  keyof ModelRoute | "modelName"
> = {
  modelName: "modelName",
  enabled: "enabled",
  displayName: "displayName",
  family: "family",
  ownedBy: "ownedBy",
  apiMode: "apiMode",
  vision: "vision",
  contextWindowSize: "contextWindowSize",
  maxOutputTokens: "maxOutputTokens",
  inputCostPerToken: "inputCostPerToken",
  outputCostPerToken: "outputCostPerToken",
  upstreamModel: "upstreamModel",
  upstreamBaseUrl: "upstreamBaseUrl",
  providerName: "providerName",
  secretRef: "secretRef",
  requestOptions: "requestOptions",
  metadata: "metadata",
};

/** `ModelRoute` → canonical route params. */
export const MODEL_ROUTE_TO_SNAKE_PARAM: Partial<
  Record<keyof ModelRoute, string>
> = {
  modelName: "modelName",
  enabled: "enabled",
  displayName: "displayName",
  family: "family",
  ownedBy: "ownedBy",
  apiMode: "apiMode",
  vision: "vision",
  contextWindowSize: "contextWindowSize",
  maxOutputTokens: "maxOutputTokens",
  inputCostPerToken: "inputCostPerToken",
  outputCostPerToken: "outputCostPerToken",
  upstreamModel: "upstreamModel",
  upstreamBaseUrl: "upstreamBaseUrl",
  providerName: "providerName",
  secretRef: "secretRef",
  requestOptions: "requestOptions",
  metadata: "metadata",
};
