import type { Prisma } from "@lite-llm/model-proxy-repository";
import type {
  LegacyLitellmParams,
  ModelProxyModelRecord,
  ModelRoute,
} from "../types/model-route.js";
import {
  MODEL_ROUTE_TO_LITELLM_PARAM,
  RESERVED_LITELLM_PARAM_KEYS,
} from "../types/model-route.js";

const RESERVED_KEY_SET = new Set<string>(RESERVED_LITELLM_PARAM_KEYS);
const LITELLM_PROXY_SENTINEL = "litellm_proxy";

const NUMERIC_PARAM_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Writable Prisma fields for `model_proxy_models` create/update. */
export type ModelProxyRowWrite = Omit<
  Prisma.ModelProxyModelCreateInput,
  "id" | "createdAt" | "updatedAt"
>;

function coerceStringParamValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "true") {
    return true;
  }
  if (lower === "false") {
    return false;
  }

  if (NUMERIC_PARAM_PATTERN.test(trimmed)) {
    const num = Number(trimmed);
    if (Number.isFinite(num)) {
      return num;
    }
  }

  return trimmed;
}

function coerceParamValue(value: unknown): unknown {
  if (typeof value === "string") {
    return coerceStringParamValue(value);
  }
  return value;
}

function coerceLitellmParams(params: LegacyLitellmParams): LegacyLitellmParams {
  const result: LegacyLitellmParams = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = coerceParamValue(value);
  }
  return result;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const coerced = coerceStringParamValue(value);
    return typeof coerced === "boolean" ? coerced : undefined;
  }
  return undefined;
}

function readNumber(value: unknown): number | undefined {
  const coerced = coerceParamValue(value);
  if (typeof coerced === "number" && Number.isFinite(coerced)) {
    return coerced;
  }
  return undefined;
}

function readInt(value: unknown): number | undefined {
  const num = readNumber(value);
  if (num === undefined) {
    return undefined;
  }
  return Number.isInteger(num) ? num : Math.trunc(num);
}

function resolveModelName(
  params: LegacyLitellmParams,
  modelName?: string,
): string {
  return (
    modelName ?? readString(params.model_name) ?? readString(params.model) ?? ""
  );
}

function readOwnedByFromProvider(provider: unknown): string | undefined {
  const value = readString(provider);
  if (!value || value === LITELLM_PROXY_SENTINEL) {
    return undefined;
  }
  return value;
}

function splitLitellmParams(params: LegacyLitellmParams): {
  reserved: LegacyLitellmParams;
  requestOptions: Record<string, unknown>;
} {
  const reserved: LegacyLitellmParams = {};
  const requestOptions: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (RESERVED_KEY_SET.has(key)) {
      reserved[key] = value;
    } else {
      requestOptions[key] = value;
    }
  }

  return { reserved, requestOptions };
}

/**
 * Convert legacy `litellm_params` JSON into a structured `ModelRoute`.
 */
export function toModelRoute(
  litellmParams: LegacyLitellmParams,
  modelName?: string,
): ModelRoute {
  const params = coerceLitellmParams(litellmParams);
  const { reserved, requestOptions } = splitLitellmParams(params);
  const resolvedName = resolveModelName(reserved, modelName);

  const route: ModelRoute = {
    modelName: resolvedName,
  };

  const enabled = readBoolean(reserved.enabled);
  if (enabled !== undefined) {
    route.enabled = enabled;
  }

  const inputCost = readNumber(reserved.input_cost_per_token);
  if (inputCost !== undefined) {
    route.inputCostPerToken = inputCost;
  }

  const outputCost = readNumber(reserved.output_cost_per_token);
  if (outputCost !== undefined) {
    route.outputCostPerToken = outputCost;
  }

  const contextWindow = readInt(reserved.context_window_size);
  if (contextWindow !== undefined) {
    route.contextWindowSize = contextWindow;
  }

  const maxOutput = readInt(reserved.max_tokens);
  if (maxOutput !== undefined) {
    route.maxOutputTokens = maxOutput;
  }

  const credentialName = readString(reserved.litellm_credential_name);
  if (credentialName) {
    route.credentialName = credentialName;
  }

  const upstreamBaseUrl = readString(reserved.api_base);
  if (upstreamBaseUrl) {
    route.upstreamBaseUrl = upstreamBaseUrl;
  }

  const ownedBy = readOwnedByFromProvider(reserved.custom_llm_provider);
  if (ownedBy) {
    route.ownedBy = ownedBy;
  }

  const modelValue = readString(reserved.model);
  if (modelValue && modelValue !== resolvedName) {
    route.upstreamModel = modelValue;
  }

  if (Object.keys(requestOptions).length > 0) {
    route.requestOptions = requestOptions;
  }

  return route;
}

/**
 * Convert `ModelRoute` into legacy `litellm_params` (snake_case) for shim exports.
 * Callers writing to LiteLLM DB should run `applyRequiredLiteLLMParams` afterward.
 */
export function fromModelRoute(route: ModelRoute): LegacyLitellmParams {
  const result: LegacyLitellmParams = {
    model: route.modelName,
    model_name: route.modelName,
  };

  for (const [routeKey, paramKey] of Object.entries(
    MODEL_ROUTE_TO_LITELLM_PARAM,
  )) {
    if (routeKey === "modelName" || routeKey === "family") {
      continue;
    }

    const value = route[routeKey as keyof ModelRoute];
    if (value === undefined) {
      continue;
    }

    if (
      routeKey === "ownedBy" &&
      typeof value === "string" &&
      value === LITELLM_PROXY_SENTINEL
    ) {
      continue;
    }

    result[paramKey] = value;
  }

  const provider =
    route.ownedBy ??
    (route.family && route.family !== LITELLM_PROXY_SENTINEL
      ? route.family
      : undefined);
  if (provider) {
    result.custom_llm_provider = provider;
  }

  if (route.upstreamModel && route.upstreamModel !== route.modelName) {
    result.model = route.upstreamModel;
  }

  const options = route.requestOptions ?? {};
  for (const [key, value] of Object.entries(options)) {
    if (!(key in result)) {
      result[key] = value;
    }
  }

  return result;
}

/** Map `ModelRoute` to Prisma create/update input for `model_proxy_models`. */
export function toModelProxyRow(route: ModelRoute): ModelProxyRowWrite {
  const requestOptions =
    route.requestOptions && Object.keys(route.requestOptions).length > 0
      ? (route.requestOptions as Prisma.InputJsonValue)
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
    credentialName: route.credentialName ?? null,
    secretRef: route.secretRef ?? null,
    ...(requestOptions !== undefined ? { requestOptions } : {}),
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
  if (row.credentialName !== null) {
    route.credentialName = row.credentialName;
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

  return route;
}
