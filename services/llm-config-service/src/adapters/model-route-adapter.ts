import type { NewModelProxyModel } from "@lite-llm/database/schema/model-proxy";
import type {
  ModelProxyModelRecord,
  ModelRoute,
  RouteParams,
} from "../types/model-route.js";
import {
  MODEL_ROUTE_TO_SNAKE_PARAM,
  RESERVED_ROUTE_PARAM_KEYS,
} from "../types/model-route.js";

const RESERVED_KEY_SET = new Set<string>(RESERVED_ROUTE_PARAM_KEYS);

const LEGACY_ROUTE_PARAM_KEYS = [
  "model",
  "model_name",
  "input_cost_per_token",
  "output_cost_per_token",
  "context_window_size",
  "max_tokens",
  "provider_name",
  "litellm_provider_name",
  "api_base",
  "custom_llm_provider",
  "litellm_params",
] as const;

const LEGACY_ROUTE_PARAM_KEY_SET = new Set<string>(LEGACY_ROUTE_PARAM_KEYS);

/** Writable database fields for `model_proxy_models` create/update. */
export type ModelProxyRowWrite = Omit<
  NewModelProxyModel,
  "id" | "createdAt" | "updatedAt"
> & {
  providerName?: string | null;
};

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function findLegacyRouteParamKeys(raw: RouteParams): string[] {
  return Object.keys(raw).filter((key) => LEGACY_ROUTE_PARAM_KEY_SET.has(key));
}

function findUnsupportedRouteParamKeys(raw: RouteParams): string[] {
  return Object.keys(raw).filter(
    (key) => !RESERVED_KEY_SET.has(key) && !LEGACY_ROUTE_PARAM_KEY_SET.has(key),
  );
}

function assertCanonicalRouteParams(raw: RouteParams): void {
  const legacyKeys = findLegacyRouteParamKeys(raw);
  if (legacyKeys.length > 0) {
    throw new Error(
      `Legacy model route fields are no longer supported: ${legacyKeys.join(", ")}`,
    );
  }

  const unsupportedKeys = findUnsupportedRouteParamKeys(raw);
  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Unsupported model route fields: ${unsupportedKeys.join(", ")}`,
    );
  }
}

function buildCanonicalModelRoute(
  raw: RouteParams,
  fallbackModelName = "",
): ModelRoute {
  assertCanonicalRouteParams(raw);

  const modelName = readString(raw.modelName) ?? fallbackModelName;
  const route: ModelRoute = { modelName };

  const enabled = readBoolean(raw.enabled);
  if (enabled !== undefined) {
    route.enabled = enabled;
  }

  const displayName = readString(raw.displayName);
  if (displayName !== undefined) {
    route.displayName = displayName;
  }

  const family = readString(raw.family);
  if (family !== undefined) {
    route.family = family;
  }

  const ownedBy = readString(raw.ownedBy);
  if (ownedBy !== undefined) {
    route.ownedBy = ownedBy;
  }

  if (raw.apiMode === "openai" || raw.apiMode === "anthropic") {
    route.apiMode = raw.apiMode;
  }

  if (typeof raw.vision === "boolean") {
    route.vision = raw.vision;
  }

  const contextWindowSize = readNumber(raw.contextWindowSize);
  if (contextWindowSize !== undefined) {
    route.contextWindowSize = contextWindowSize;
  }

  const maxOutputTokens = readNumber(raw.maxOutputTokens);
  if (maxOutputTokens !== undefined) {
    route.maxOutputTokens = maxOutputTokens;
  }

  const inputCostPerToken = readNumber(raw.inputCostPerToken);
  if (inputCostPerToken !== undefined) {
    route.inputCostPerToken = inputCostPerToken;
  }

  const outputCostPerToken = readNumber(raw.outputCostPerToken);
  if (outputCostPerToken !== undefined) {
    route.outputCostPerToken = outputCostPerToken;
  }

  const upstreamModel = readString(raw.upstreamModel);
  if (upstreamModel !== undefined) {
    route.upstreamModel = upstreamModel;
  }

  const upstreamBaseUrl = readString(raw.upstreamBaseUrl);
  if (upstreamBaseUrl !== undefined) {
    route.upstreamBaseUrl = upstreamBaseUrl;
  }

  const providerName = readString(raw.providerName);
  if (providerName !== undefined) {
    route.providerName = providerName;
  }

  const secretRef = readString(raw.secretRef);
  if (secretRef !== undefined) {
    route.secretRef = secretRef;
  }

  const requestOptions = readRecord(raw.requestOptions);
  if (requestOptions && Object.keys(requestOptions).length > 0) {
    route.requestOptions = requestOptions;
  }

  const metadata = readRecord(raw.metadata);
  if (metadata && Object.keys(metadata).length > 0) {
    route.metadata = metadata;
  }

  return route;
}

/** Parse a canonical `modelRoute` payload into a structured `ModelRoute`. */
export function toModelRoute(
  routeParams: RouteParams,
  modelName?: string,
): ModelRoute {
  return buildCanonicalModelRoute(routeParams, modelName);
}

/**
 * Parse a model route from the HTTP API. Legacy route field names are rejected.
 */
export function parseModelRouteFromApi(
  raw: RouteParams,
  fallbackModelName: string,
): ModelRoute {
  return buildCanonicalModelRoute(raw, fallbackModelName);
}

/** Convert `ModelRoute` into the canonical API payload shape. */
export function fromModelRoute(route: ModelRoute): RouteParams {
  const result: RouteParams = {};

  for (const [routeKey, paramKey] of Object.entries(
    MODEL_ROUTE_TO_SNAKE_PARAM,
  )) {
    const value = route[routeKey as keyof ModelRoute];
    if (value !== undefined) {
      result[paramKey] = value;
    }
  }

  return result;
}

/** Map `ModelRoute` to a writable `model_proxy_models` row shape. */
export function toModelProxyRow(route: ModelRoute): ModelProxyRowWrite {
  const requestOptions =
    route.requestOptions && Object.keys(route.requestOptions).length > 0
      ? route.requestOptions
      : undefined;

  const metadata =
    route.metadata && Object.keys(route.metadata).length > 0
      ? route.metadata
      : undefined;

  return {
    modelName: route.modelName,
    enabled: route.enabled ?? true,
    displayName: route.displayName ?? null,
    family: route.family ?? null,
    ownedBy: route.ownedBy ?? null,
    apiMode: route.apiMode ?? null,
    vision: route.vision ?? null,
    contextWindowSize: route.contextWindowSize ?? null,
    maxOutputTokens: route.maxOutputTokens ?? null,
    inputCostPerToken: route.inputCostPerToken ?? null,
    outputCostPerToken: route.outputCostPerToken ?? null,
    upstreamModel: route.upstreamModel ?? null,
    upstreamBaseUrl: route.upstreamBaseUrl ?? null,
    providerName: route.providerName ?? null,
    secretRef: route.secretRef ?? null,
    ...(requestOptions !== undefined ? { requestOptions } : {}),
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

/** Map a registry DB row into `ModelRoute`. */
export function fromModelProxyRow(row: ModelProxyModelRecord): ModelRoute {
  const route: ModelRoute = {
    modelName: row.modelName,
    enabled: row.enabled,
  };

  if (row.displayName !== null) {
    route.displayName = row.displayName;
  }
  if (row.family !== null) {
    route.family = row.family;
  }
  if (row.ownedBy !== null) {
    route.ownedBy = row.ownedBy;
  }
  if (row.apiMode === "openai" || row.apiMode === "anthropic") {
    route.apiMode = row.apiMode;
  }
  if (row.vision !== null) {
    route.vision = row.vision;
  }
  if (row.contextWindowSize !== null) {
    route.contextWindowSize = row.contextWindowSize;
  }
  if (row.maxOutputTokens !== null) {
    route.maxOutputTokens = row.maxOutputTokens;
  }
  if (row.inputCostPerToken !== null) {
    route.inputCostPerToken = row.inputCostPerToken;
  }
  if (row.outputCostPerToken !== null) {
    route.outputCostPerToken = row.outputCostPerToken;
  }
  if (row.upstreamModel !== null) {
    route.upstreamModel = row.upstreamModel;
  }
  if (row.upstreamBaseUrl !== null) {
    route.upstreamBaseUrl = row.upstreamBaseUrl;
  }
  if (row.providerName !== null) {
    route.providerName = row.providerName;
  }
  if (row.secretRef !== null) {
    route.secretRef = row.secretRef;
  }
  if (
    row.requestOptions !== null &&
    Object.keys(row.requestOptions).length > 0
  ) {
    route.requestOptions = row.requestOptions;
  }
  if (row.metadata !== null && Object.keys(row.metadata).length > 0) {
    route.metadata = row.metadata;
  }

  return route;
}
