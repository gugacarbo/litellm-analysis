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

/**
 * Normalize a per-token cost value to a plain USD/token number.
 *
 * The `costSchema` in `models-repository` is canonicalized in USD/token
 * (the same unit as LiteLLM's `input_cost_per_token` / `output_cost_per_token`),
 * so no scaling is required. This helper exists to keep callers explicit
 * and to guard against `NaN` / non-number inputs.
 */
export function toCostPerToken(costPerToken?: number): number | undefined {
  if (typeof costPerToken !== "number" || Number.isNaN(costPerToken)) {
    return undefined;
  }
  return costPerToken;
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
  return normalizeCredentialName(
    params.litellm_credential_name as string | undefined,
  );
}

export function resolveModelCredential(
  litellmParams: Record<string, unknown>,
  fallbackCredential?: string | null,
): string | undefined {
  return (
    getCredentialNameFromParams(litellmParams) ??
    normalizeCredentialName(fallbackCredential)
  );
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

export function coerceLiteLLMParamValue(value: unknown): unknown {
  if (typeof value === "string") {
    return coerceStringParamValue(value);
  }
  return value;
}

export function coerceLiteLLMParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = coerceLiteLLMParamValue(value);
  }
  return result;
}

export function applyRequiredLiteLLMParams(
  modelName: string,
  litellmParams: Record<string, unknown>,
  credentialName?: string | null,
): Record<string, unknown> {
  const nextParams: Record<string, unknown> = { ...litellmParams };
  nextParams.model = modelName;
  nextParams.model_name = modelName;
  nextParams.custom_llm_provider = "litellm_proxy";
  nextParams.use_litellm_proxy = false;
  nextParams.use_in_pass_through = false;
  nextParams.merge_reasoning_content_in_choices = false;

  const resolvedCredential = resolveModelCredential(nextParams, credentialName);
  if (resolvedCredential) {
    nextParams.litellm_credential_name = resolvedCredential;
  } else {
    delete nextParams.litellm_credential_name;
  }

  return nextParams;
}

export function buildLiteLLMParams(
  modelName: string,
  spec: {
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  credentialName?: string | null,
): Record<string, unknown> {
  const litellmParams = applyRequiredLiteLLMParams(
    modelName,
    {
      model: modelName,
      model_name: modelName,
      context_window_size: spec.limits.length,
      max_tokens: spec.limits.maxOutput,
    },
    credentialName,
  );

  const inputCostPerToken = toCostPerToken(spec.cost?.input);
  const outputCostPerToken = toCostPerToken(spec.cost?.output);

  if (inputCostPerToken !== undefined) {
    litellmParams.input_cost_per_token = inputCostPerToken;
  }
  if (outputCostPerToken !== undefined) {
    litellmParams.output_cost_per_token = outputCostPerToken;
  }

  return litellmParams;
}

export function buildMergedLiteLLMParams(
  modelName: string,
  spec: {
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  existingParams: Record<string, unknown>,
  defaultCredential?: string | null,
): Record<string, unknown> {
  const modelCredential =
    getCredentialNameFromParams(existingParams) ?? defaultCredential;
  const builtParams = buildLiteLLMParams(modelName, spec, modelCredential);

  return applyRequiredLiteLLMParams(
    modelName,
    {
      ...existingParams,
      ...builtParams,
    },
    modelCredential,
  );
}
