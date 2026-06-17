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

function normalizeCredentialName(
  credentialName?: string | null,
): string | undefined {
  if (typeof credentialName !== "string") {
    return undefined;
  }

  const normalized = credentialName.trim();
  return normalized ? normalized : undefined;
}

export function getCredentialNameFromParams(
  params: Record<string, unknown>,
): string | undefined {
  return (
    normalizeCredentialName(params.credential_name as string | undefined) ??
    normalizeCredentialName(
      params.litellm_credential_name as string | undefined,
    )
  );
}

export function resolveModelCredential(
  params: Record<string, unknown>,
  fallbackCredential?: string | null,
): string | undefined {
  return (
    getCredentialNameFromParams(params) ??
    normalizeCredentialName(fallbackCredential)
  );
}

export function normalizeModelRoute(
  modelName: string,
  route: ModelRoute,
  credentialName?: string | null,
): ModelRoute {
  const resolvedCredential = resolveModelCredential(
    route as unknown as Record<string, unknown>,
    credentialName,
  );

  return {
    ...route,
    modelName,
    credentialName: resolvedCredential ?? route.credentialName,
  };
}

export function buildModelRouteFromSpec(
  modelName: string,
  spec: {
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  credentialName?: string | null,
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

  return normalizeModelRoute(modelName, route, credentialName);
}

export function mergeModelRouteFromSpec(
  modelName: string,
  spec: {
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  existingRoute: ModelRoute,
  defaultCredential?: string | null,
): ModelRoute {
  const modelCredential =
    existingRoute.credentialName ??
    getCredentialNameFromParams(
      existingRoute as unknown as Record<string, unknown>,
    ) ??
    defaultCredential;
  const builtRoute = buildModelRouteFromSpec(modelName, spec, modelCredential);

  return normalizeModelRoute(
    modelName,
    {
      ...existingRoute,
      ...builtRoute,
    },
    modelCredential,
  );
}
