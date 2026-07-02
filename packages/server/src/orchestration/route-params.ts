import type { ModelRoute } from "@lite-llm/model-proxy-registry-service";

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

export function coerceRouteParamValue(value: unknown): unknown {
  if (typeof value === "string") {
    return coerceStringParamValue(value);
  }
  return value;
}

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
  params: Record<string, unknown>,
): string | undefined {
  return (
    normalizeProviderName(params.provider_name as string | undefined) ??
    normalizeProviderName(params.litellm_provider_name as string | undefined)
  );
}

export function resolveModelProvider(
  params: Record<string, unknown>,
  fallbackProvider?: string | null,
): string | undefined {
  return (
    getProviderNameFromParams(params) ?? normalizeProviderName(fallbackProvider)
  );
}

export function normalizeModelRoute(
  modelName: string,
  route: ModelRoute,
  providerName?: string | null,
): ModelRoute {
  const resolvedProvider = resolveModelProvider(
    route as unknown as Record<string, unknown>,
    providerName,
  );

  return {
    ...route,
    modelName,
    providerName: resolvedProvider ?? route.providerName,
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
    modelName,
    contextWindowSize: spec.limits.length,
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
  const modelProvider =
    existingRoute.providerName ??
    getProviderNameFromParams(
      existingRoute as unknown as Record<string, unknown>,
    ) ??
    defaultProvider;
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
