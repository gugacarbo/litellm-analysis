import { fetchApi } from "./core";

type ModelReasoningConfig = {
  effort?: "low" | "medium" | "high" | "xhigh";
  enableThinking?: boolean;
  includeReasoningInRequest?: boolean;
  apiMode?: "openai" | "anthropic";
};

type ModelApiMode = "openai" | "anthropic";

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
  providerName?: string;
  requestOptions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ModelConfig = {
  modelName: string;
  modelRoute: ModelRoute;
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

type ModelSyncPresenceStatus = "synced" | "config-only" | "registry-only";

export type ModelWithStatus = ModelConfig & {
  status: ModelSyncPresenceStatus;
};

type ModelsWithConfigCounts = {
  synced: number;
  configOnly: number;
  registryOnly: number;
  total: number;
};

export type SettingsStorage = "file" | "database";

export type ModelsWithConfigResponse = {
  models: ModelWithStatus[];
  counts: ModelsWithConfigCounts;
  settingsStorage: SettingsStorage;
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

/** Resolve `modelRoute` from a model config. */
export function resolveModelRoute(model: {
  modelName: string;
  modelRoute?: ModelRoute;
}): ModelRoute {
  return model.modelRoute ?? { modelName: model.modelName };
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
      providerName: readString(raw.providerName),
      requestOptions: isRecord(raw.requestOptions)
        ? raw.requestOptions
        : undefined,
      metadata: isRecord(raw.metadata) ? raw.metadata : undefined,
    };
  }
  return { modelName };
}

function normalizeModelConfig(raw: Record<string, unknown>): ModelConfig {
  const modelName = String(raw.modelName ?? "");
  const modelRoute = isRecord(raw.modelRoute)
    ? normalizeModelRoute(raw.modelRoute, modelName)
    : { modelName };

  return {
    modelName,
    modelRoute,
    enabled: readBoolean(raw.enabled),
    config: isRecord(raw.config)
      ? (raw.config as ModelConfig["config"])
      : undefined,
  };
}

function normalizeModelWithStatus(
  raw: Record<string, unknown>,
): ModelWithStatus {
  const base = normalizeModelConfig(raw);
  return {
    ...base,
    status: String(raw.status ?? "synced") as ModelSyncPresenceStatus,
  };
}

function normalizeModelsCounts(
  raw: Record<string, unknown>,
): ModelsWithConfigCounts {
  return {
    synced: readInt(raw.synced) ?? 0,
    configOnly: readInt(raw.configOnly) ?? 0,
    registryOnly: readInt(raw.registryOnly) ?? 0,
    total: readInt(raw.total) ?? 0,
  };
}

function normalizeModelsWithConfigResponse(
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
    settingsStorage: "database",
  };
}

export async function getAllModels(): Promise<ModelConfig[]> {
  const data = await fetchApi<Record<string, unknown>[]>("/models");
  return data.map((model) => normalizeModelConfig(model));
}

export async function getModelsWithConfig(): Promise<ModelsWithConfigResponse> {
  const data = await fetchApi<Record<string, unknown>>("/models/with-config");
  return normalizeModelsWithConfigResponse(data);
}
