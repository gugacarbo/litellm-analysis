import { fetchApi } from "./core";

export type ModelReasoningConfig = {
  effort?: "low" | "medium" | "high" | "xhigh";
  enableThinking?: boolean;
  includeReasoningInRequest?: boolean;
  apiMode?: "openai" | "anthropic";
};

export type ModelApiMode = "openai" | "anthropic";

/** Structured model routing config — primary Batch 3 contract. */
export type ModelRoute = {
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
  credentialName?: string;
  secretRef?: string;
  requestOptions?: Record<string, unknown>;
};

export type ModelRouteUpdate = Partial<Omit<ModelRoute, "modelName">>;

export type ModelConfig = {
  modelName: string;
  modelRoute: ModelRoute;
  /** @deprecated Snake_case shim — use `modelRoute` in new code. */
  litellmParams?: Record<string, unknown>;
  enabled?: boolean;
  config?: {
    displayName?: string;
    family?: string;
    ownedBy?: string;
    apiMode?: ModelApiMode;
    vision?: boolean;
    thinking?: { levels?: string[] };
    reasoning?: ModelReasoningConfig;
  };
};

export type ModelSyncPresenceStatus =
  | "synced"
  | "config-only"
  | "registry-only";

export type ModelWithStatus = ModelConfig & {
  status: ModelSyncPresenceStatus;
};

export type ModelsWithConfigCounts = {
  synced: number;
  configOnly: number;
  registryOnly: number;
  total: number;
  /** @deprecated Use `registryOnly`. */
  litellmOnly?: number;
};

export type ModelsWithConfigResponse = {
  models: ModelWithStatus[];
  counts: ModelsWithConfigCounts;
};

export type SyncDirection = "config-to-registry" | "registry-to-config";

/** @deprecated Use `config-to-registry` / `registry-to-config`. */
export type LegacySyncDirection = "config-to-litellm" | "litellm-to-config";

export type SyncField =
  | "model_presence"
  | "enabled"
  | "context_window_size"
  | "max_tokens"
  | "input_cost_per_token"
  | "output_cost_per_token";

export type ModelSyncDiffItem = {
  modelName: string;
  field: SyncField;
  configValue: unknown;
  registryValue: unknown;
  defaultDirection: SyncDirection;
  /** @deprecated Use `registryValue`. */
  litellmValue?: unknown;
};

export type ModelSyncSelection = {
  modelName: string;
  field: SyncField;
  direction: SyncDirection | LegacySyncDirection;
};

export type ModelProviderConfig = {
  name: string;
  ownedBy: string;
  baseUrl: string;
  apiKey: string;
  defaultCredential: string;
};

export type DefaultSettingsDiffResponse = {
  defaultCredential: string;
  mismatchedModels: string[];
  count: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
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

/** Map legacy presence labels to Batch 3 names. */
export function normalizeSyncPresenceStatus(
  status: string,
): ModelSyncPresenceStatus {
  if (status === "litellm-only") {
    return "registry-only";
  }
  return status as ModelSyncPresenceStatus;
}

/** Map legacy sync direction labels to Batch 3 names. */
export function normalizeSyncDirection(direction: string): SyncDirection {
  if (direction === "config-to-litellm") {
    return "config-to-registry";
  }
  if (direction === "litellm-to-config") {
    return "registry-to-config";
  }
  return direction as SyncDirection;
}

/** Convert structured `modelRoute` to snake_case params for legacy callers. */
export function modelRouteToLitellmParams(
  route: ModelRoute,
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    model: route.modelName,
    model_name: route.modelName,
  };

  if (route.enabled !== undefined) {
    result.enabled = route.enabled;
  }
  if (route.inputCostPerToken !== undefined) {
    result.input_cost_per_token = route.inputCostPerToken;
  }
  if (route.outputCostPerToken !== undefined) {
    result.output_cost_per_token = route.outputCostPerToken;
  }
  if (route.contextWindowSize !== undefined) {
    result.context_window_size = route.contextWindowSize;
  }
  if (route.maxOutputTokens !== undefined) {
    result.max_tokens = route.maxOutputTokens;
  }
  if (route.credentialName) {
    result.litellm_credential_name = route.credentialName;
  }
  if (route.upstreamBaseUrl) {
    result.api_base = route.upstreamBaseUrl;
  }
  if (route.ownedBy) {
    result.custom_llm_provider = route.ownedBy;
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

/** Convert snake_case params from legacy API payloads into `modelRoute`. */
export function litellmParamsToModelRoute(
  litellmParams: Record<string, unknown> | undefined,
  modelName: string,
): ModelRoute {
  const params = litellmParams ?? {};
  const route: ModelRoute = { modelName };

  const enabled = readBoolean(params.enabled);
  if (enabled !== undefined) {
    route.enabled = enabled;
  }

  const inputCost = readNumber(params.input_cost_per_token);
  if (inputCost !== undefined) {
    route.inputCostPerToken = inputCost;
  }

  const outputCost = readNumber(params.output_cost_per_token);
  if (outputCost !== undefined) {
    route.outputCostPerToken = outputCost;
  }

  const contextWindow = readInt(params.context_window_size);
  if (contextWindow !== undefined) {
    route.contextWindowSize = contextWindow;
  }

  const maxOutput = readInt(params.max_tokens);
  if (maxOutput !== undefined) {
    route.maxOutputTokens = maxOutput;
  }

  const credentialName = readString(params.litellm_credential_name);
  if (credentialName) {
    route.credentialName = credentialName;
  }

  const upstreamBaseUrl = readString(params.api_base);
  if (upstreamBaseUrl) {
    route.upstreamBaseUrl = upstreamBaseUrl;
  }

  const ownedBy = readString(params.custom_llm_provider);
  if (ownedBy && ownedBy !== "litellm_proxy") {
    route.ownedBy = ownedBy;
  }

  const upstreamModel = readString(params.model);
  if (upstreamModel && upstreamModel !== modelName) {
    route.upstreamModel = upstreamModel;
  }

  const reserved = new Set([
    "model",
    "model_name",
    "enabled",
    "input_cost_per_token",
    "output_cost_per_token",
    "context_window_size",
    "max_tokens",
    "litellm_credential_name",
    "api_base",
    "custom_llm_provider",
  ]);

  const requestOptions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!reserved.has(key)) {
      requestOptions[key] = value;
    }
  }
  if (Object.keys(requestOptions).length > 0) {
    route.requestOptions = requestOptions;
  }

  return route;
}

/** Resolve `modelRoute` from a model config, normalizing legacy payloads. */
export function resolveModelRoute(model: {
  modelName: string;
  modelRoute?: ModelRoute;
  litellmParams?: Record<string, unknown>;
}): ModelRoute {
  if (model.modelRoute) {
    return model.modelRoute;
  }
  return litellmParamsToModelRoute(model.litellmParams, model.modelName);
}

/** Snake_case shim for legacy display helpers and API writes. */
export function getLitellmParamsShim(model: {
  modelName: string;
  modelRoute?: ModelRoute;
  litellmParams?: Record<string, unknown>;
}): Record<string, unknown> {
  if (model.litellmParams && Object.keys(model.litellmParams).length > 0) {
    return model.litellmParams;
  }
  return modelRouteToLitellmParams(resolveModelRoute(model));
}

function normalizeModelRoute(raw: unknown, modelName: string): ModelRoute {
  if (isRecord(raw)) {
    return {
      modelName: readString(raw.modelName) ?? modelName,
      enabled: readBoolean(raw.enabled),
      displayName: readString(raw.displayName),
      family: readString(raw.family),
      ownedBy: readString(raw.ownedBy),
      apiMode:
        raw.apiMode === "openai" || raw.apiMode === "anthropic"
          ? raw.apiMode
          : undefined,
      vision: readBoolean(raw.vision),
      contextWindowSize: readInt(raw.contextWindowSize),
      maxOutputTokens: readInt(raw.maxOutputTokens),
      inputCostPerToken: readNumber(raw.inputCostPerToken),
      outputCostPerToken: readNumber(raw.outputCostPerToken),
      upstreamModel: readString(raw.upstreamModel),
      upstreamBaseUrl: readString(raw.upstreamBaseUrl),
      credentialName: readString(raw.credentialName),
      secretRef: readString(raw.secretRef),
      requestOptions: isRecord(raw.requestOptions)
        ? raw.requestOptions
        : undefined,
    };
  }
  return { modelName };
}

export function normalizeModelConfig(
  raw: Record<string, unknown>,
): ModelConfig {
  const modelName = String(raw.modelName ?? "");
  const modelRoute = isRecord(raw.modelRoute)
    ? normalizeModelRoute(raw.modelRoute, modelName)
    : litellmParamsToModelRoute(
        isRecord(raw.litellmParams) ? raw.litellmParams : undefined,
        modelName,
      );

  return {
    modelName,
    modelRoute,
    litellmParams: getLitellmParamsShim({
      modelName,
      modelRoute,
      litellmParams: isRecord(raw.litellmParams)
        ? raw.litellmParams
        : undefined,
    }),
    enabled: readBoolean(raw.enabled),
    config: isRecord(raw.config)
      ? (raw.config as ModelConfig["config"])
      : undefined,
  };
}

export function normalizeModelWithStatus(
  raw: Record<string, unknown>,
): ModelWithStatus {
  const base = normalizeModelConfig(raw);
  return {
    ...base,
    status: normalizeSyncPresenceStatus(String(raw.status ?? "synced")),
  };
}

function normalizeModelsCounts(
  raw: Record<string, unknown>,
): ModelsWithConfigCounts {
  const registryOnly =
    readInt(raw.registryOnly) ?? readInt(raw.litellmOnly) ?? 0;

  return {
    synced: readInt(raw.synced) ?? 0,
    configOnly: readInt(raw.configOnly) ?? 0,
    registryOnly,
    total: readInt(raw.total) ?? 0,
    litellmOnly: registryOnly,
  };
}

export function normalizeModelsWithConfigResponse(
  raw: Record<string, unknown>,
): ModelsWithConfigResponse {
  const models = Array.isArray(raw.models)
    ? raw.models
        .filter(isRecord)
        .map((model) => normalizeModelWithStatus(model))
    : [];

  return {
    models,
    counts: isRecord(raw.counts)
      ? normalizeModelsCounts(raw.counts)
      : { synced: 0, configOnly: 0, registryOnly: 0, total: 0 },
  };
}

function normalizeModelSyncDiffItem(
  raw: Record<string, unknown>,
): ModelSyncDiffItem {
  const registryValue =
    "registryValue" in raw ? raw.registryValue : raw.litellmValue;

  return {
    modelName: String(raw.modelName ?? ""),
    field: raw.field as SyncField,
    configValue: raw.configValue,
    registryValue,
    litellmValue: registryValue,
    defaultDirection: normalizeSyncDirection(
      String(raw.defaultDirection ?? "config-to-registry"),
    ),
  };
}

function toLitellmParamsBody(
  routeOrParams: ModelRouteUpdate | Record<string, unknown>,
): Record<string, unknown> {
  if (
    "inputCostPerToken" in routeOrParams ||
    "outputCostPerToken" in routeOrParams ||
    "contextWindowSize" in routeOrParams ||
    "maxOutputTokens" in routeOrParams ||
    "upstreamBaseUrl" in routeOrParams ||
    "credentialName" in routeOrParams ||
    "requestOptions" in routeOrParams
  ) {
    return modelRouteToLitellmParams({
      modelName: "",
      ...(routeOrParams as ModelRouteUpdate),
    });
  }
  return routeOrParams as Record<string, unknown>;
}

export async function updateModel(
  modelName: string,
  routeOrParams: ModelRouteUpdate | Record<string, unknown>,
  newName?: string,
  config?: ModelConfig["config"],
): Promise<{ success: boolean }> {
  const litellmParams = toLitellmParamsBody(routeOrParams);
  const modelRoute =
    "inputCostPerToken" in routeOrParams ||
    "outputCostPerToken" in routeOrParams ||
    "contextWindowSize" in routeOrParams ||
    "maxOutputTokens" in routeOrParams ||
    "upstreamBaseUrl" in routeOrParams ||
    "credentialName" in routeOrParams ||
    "requestOptions" in routeOrParams ||
    "enabled" in routeOrParams
      ? (routeOrParams as ModelRouteUpdate)
      : undefined;

  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "PUT",
    body: JSON.stringify({
      ...(modelRoute ? { modelRoute } : {}),
      litellmParams,
      ...(newName ? { modelName: newName } : {}),
      ...(config ? { config } : {}),
    }),
  });
}

export async function getAllModels(): Promise<ModelConfig[]> {
  const data = await fetchApi<Record<string, unknown>[]>("/models");
  return data.map((model) => normalizeModelConfig(model));
}

export async function createModel(
  model: ModelConfig,
): Promise<{ success: boolean }> {
  const litellmParams = getLitellmParamsShim(model);
  return fetchApi("/models", {
    method: "POST",
    body: JSON.stringify({
      modelName: model.modelName,
      modelRoute: model.modelRoute,
      litellmParams,
    }),
  });
}

export async function deleteModel(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "DELETE",
  });
}

export async function deleteModelLogs(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/logs/${encodeURIComponent(modelName)}`, {
    method: "DELETE",
  });
}

export async function getModelsWithConfig(): Promise<ModelsWithConfigResponse> {
  const data = await fetchApi<Record<string, unknown>>("/models/with-config");
  return normalizeModelsWithConfigResponse(data);
}

export async function syncModelsFromConfig(): Promise<{ success: boolean }> {
  return fetchApi("/models/sync-from-config", {
    method: "POST",
  });
}

export async function getModelsSyncDiff(): Promise<{
  items: ModelSyncDiffItem[];
}> {
  const data = await fetchApi<{ items?: Record<string, unknown>[] }>(
    "/models/sync-diff",
  );
  const items = Array.isArray(data.items)
    ? data.items.filter(isRecord).map(normalizeModelSyncDiffItem)
    : [];
  return { items };
}

export async function syncModelsBatch(
  selections: ModelSyncSelection[],
): Promise<{
  success: boolean;
  applied: number;
}> {
  return fetchApi("/models/sync-batch", {
    method: "POST",
    body: JSON.stringify({
      selections: selections.map((selection) => ({
        ...selection,
        direction: normalizeSyncDirection(selection.direction),
      })),
    }),
  });
}

export async function addModelToConfig(
  modelName: string,
): Promise<{ success: boolean }> {
  return fetchApi("/models/add-to-config", {
    method: "POST",
    body: JSON.stringify({ modelName }),
  });
}

export async function toggleModelEnabled(
  modelName: string,
  enabled: boolean,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: "PUT",
    body: JSON.stringify({
      modelRoute: { enabled },
      litellmParams: { enabled },
    }),
  });
}

export async function mergeModels(
  sourceModel: string,
  targetModel: string,
): Promise<{ success: boolean }> {
  return fetchApi("/models/merge", {
    method: "POST",
    body: JSON.stringify({ sourceModel, targetModel }),
  });
}

export async function getModelProvider(
  providerId: string,
): Promise<ModelProviderConfig> {
  return fetchApi(`/models/providers/${encodeURIComponent(providerId)}`);
}

export async function updateModelProvider(
  providerId: string,
  updates: Partial<ModelProviderConfig>,
): Promise<ModelProviderConfig> {
  return fetchApi(`/models/providers/${encodeURIComponent(providerId)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function getDefaultSettingsDiff(): Promise<DefaultSettingsDiffResponse> {
  return fetchApi("/models/default-settings-diff");
}

export async function syncDefaultSettings(): Promise<{
  success: boolean;
  updated: number;
  defaultCredential: string;
}> {
  return fetchApi("/models/sync-default-settings", {
    method: "POST",
  });
}
