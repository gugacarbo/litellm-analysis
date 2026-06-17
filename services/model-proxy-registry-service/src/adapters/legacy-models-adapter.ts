import type { Prisma } from "@lite-llm/model-proxy-repository";
import { RESERVED_LITELLM_PARAM_KEYS } from "../types/model-route.js";

const LITELLM_PROXY_SENTINEL = "litellm_proxy";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function resolveModelName(
  fallbackName: string,
  params: Record<string, unknown>,
): string {
  return (
    readString(params.model) ?? readString(params.model_name) ?? fallbackName
  );
}

function resolveProvider(params: Record<string, unknown>): {
  ownedBy: string | null;
  family: string | null;
} {
  const provider = readString(params.custom_llm_provider);
  if (!provider || provider === LITELLM_PROXY_SENTINEL) {
    return { ownedBy: null, family: null };
  }

  return { ownedBy: provider, family: provider };
}

function buildRequestOptions(
  params: Record<string, unknown>,
): Record<string, unknown> | null {
  const reserved = new Set<string>(RESERVED_LITELLM_PARAM_KEYS);
  const requestOptions: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (!reserved.has(key)) {
      requestOptions[key] = value;
    }
  }

  return Object.keys(requestOptions).length > 0 ? requestOptions : null;
}

export function toModelProxyRow(
  modelName: string,
  litellmParams: unknown,
): Prisma.ModelProxyModelCreateInput {
  const params = isRecord(litellmParams) ? litellmParams : {};
  const resolvedName = resolveModelName(modelName, params);
  const { ownedBy, family } = resolveProvider(params);
  const upstreamModel =
    readString(params.model) && readString(params.model) !== resolvedName
      ? readString(params.model)
      : null;

  const requestOptions = buildRequestOptions(params);

  return {
    modelName: resolvedName,
    enabled: readBoolean(params.enabled, true),
    displayName: null,
    family,
    ownedBy,
    apiMode: null,
    vision: null,
    inputCostPerToken: readNumber(params.input_cost_per_token),
    outputCostPerToken: readNumber(params.output_cost_per_token),
    contextWindowSize: readNumber(params.context_window_size),
    maxOutputTokens: readNumber(params.max_tokens),
    credentialName: readString(params.litellm_credential_name),
    upstreamBaseUrl: readString(params.api_base),
    upstreamModel,
    secretRef: null,
    ...(requestOptions
      ? { requestOptions: requestOptions as Prisma.InputJsonValue }
      : {}),
  };
}

export interface LegacyModelRow {
  modelName: string;
  litellmParams: unknown;
  updatedAt: Date;
}

export function dedupeLegacyModels(rows: LegacyModelRow[]): {
  models: LegacyModelRow[];
  duplicateWarnings: string[];
} {
  const sorted = [...rows].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
  );
  const seen = new Set<string>();
  const models: LegacyModelRow[] = [];
  const duplicateWarnings: string[] = [];

  for (const row of sorted) {
    if (seen.has(row.modelName)) {
      duplicateWarnings.push(
        `Duplicate model_name "${row.modelName}" in LiteLLM_ProxyModelTable; kept newest row`,
      );
      continue;
    }

    seen.add(row.modelName);
    models.push(row);
  }

  return { models, duplicateWarnings };
}
