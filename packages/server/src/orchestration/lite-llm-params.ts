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

export function toCostPerToken(costPerMillion?: number): number | undefined {
  if (typeof costPerMillion !== "number" || Number.isNaN(costPerMillion)) {
    return undefined;
  }
  return costPerMillion / 1_000_000;
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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  const litellmCredentialName = normalizeCredentialName(credentialName);
  if (litellmCredentialName) {
    nextParams.litellm_credential_name = litellmCredentialName;
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
