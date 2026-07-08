import type { ModelRoute } from "@lite-llm/llm-config-service";

export function parseDays(rawValue: unknown, fallback: number): number {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const MAX_DAYS = 365;
  const parsed = Number.parseFloat(rawValue);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, MAX_DAYS);
}

// @knipignore
export function toCostPerToken(costPerToken?: number): number | undefined {
  if (typeof costPerToken !== "number" || Number.isNaN(costPerToken)) {
    return undefined;
  }
  return costPerToken;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const NUMERIC_PARAM_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

// @knipignore
export function coerceStringParamValue(raw: string): unknown {
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

// @knipignore
export function coerceRouteParamValue(value: unknown): unknown {
  if (typeof value === "string") {
    return coerceStringParamValue(value);
  }
  return value;
}

// @knipignore
export function coerceRouteParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = coerceRouteParamValue(value);
  }
  return result;
}

function normalizeProviderName(
  providerName?: string | null,
): string | undefined {
  if (typeof providerName !== "string") {
    return undefined;
  }

  const normalized = providerName.trim();
  return normalized ? normalized : undefined;
}

export function getProviderNameFromParams(
  params: ModelRoute,
): string | undefined {
  return normalizeProviderName(params.providerName);
}

export function resolveModelProvider(
  params: ModelRoute,
  defaultProvider?: string | null,
): string | undefined {
  return (
    getProviderNameFromParams(params) ?? normalizeProviderName(defaultProvider)
  );
}

export function normalizeModelRoute(
  modelName: string,
  route: ModelRoute,
  defaultProvider?: string | null,
): ModelRoute {
  const resolvedProvider = resolveModelProvider(route, defaultProvider);

  return {
    ...route,
    modelId: modelName,
    modelName,
    providerName: resolvedProvider ?? route.providerName,
    contextLength: route.contextLength ?? route.contextWindowSize,
    contextWindowSize: route.contextWindowSize ?? route.contextLength,
    maxCompletionTokens: route.maxCompletionTokens ?? route.maxOutputTokens,
    maxOutputTokens: route.maxOutputTokens ?? route.maxCompletionTokens,
    inputCostPerToken: route.inputCostPerToken,
    outputCostPerToken: route.outputCostPerToken,
  };
}

export function buildModelRouteFromSpec(
  modelName: string,
  spec: {
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  providerName?: string | null,
): ModelRoute {
  const route: ModelRoute = {
    modelId: modelName,
    modelName,
    contextLength: spec.limits.length,
    contextWindowSize: spec.limits.length,
    maxCompletionTokens: spec.limits.maxOutput,
    maxOutputTokens: spec.limits.maxOutput,
  };

  const inputCostPerToken = toCostPerToken(spec.cost?.input);
  const outputCostPerToken = toCostPerToken(spec.cost?.output);

  if (inputCostPerToken !== undefined) {
    route.inputCostPerToken = inputCostPerToken;
  }
  if (outputCostPerToken !== undefined) {
    route.outputCostPerToken = outputCostPerToken;
  }

  return normalizeModelRoute(modelName, route, providerName);
}

export function mergeModelRouteFromSpec(
  modelName: string,
  spec: {
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  existingRoute: ModelRoute,
  defaultProvider?: string | null,
): ModelRoute {
  const modelProvider = existingRoute.providerName ?? defaultProvider;
  const builtRoute = buildModelRouteFromSpec(modelName, spec, modelProvider);

  return normalizeModelRoute(
    modelName,
    {
      ...existingRoute,
      ...builtRoute,
    },
    modelProvider,
  );
}
