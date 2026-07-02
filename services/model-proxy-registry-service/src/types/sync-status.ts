/**
 * Sync presence and direction types for dashboard config compatibility ↔
 * the `model_proxy_models` registry.
 */

import type { ModelRoute } from "./model-route.js";

/** Where a model exists relative to the registry and compatibility config payloads. */
export type ModelSyncPresenceStatus =
  | "synced"
  | "config-only"
  | "registry-only";

/** Direction for resolving a field mismatch during sync-batch. */
export type ModelSyncDirection = "config-to-registry" | "registry-to-config";

/** Fields compared between compatibility config payloads and registry routes. */
export type ModelSyncField =
  | "model_presence"
  | "enabled"
  | "context_window_size"
  | "max_tokens"
  | "input_cost_per_token"
  | "output_cost_per_token";

/** Reasoning/thinking metadata retained in compatibility config payloads. */
export interface ModelConfigReasoning {
  effort?: "low" | "medium" | "high" | "xhigh";
  enableThinking?: boolean;
  includeReasoningInRequest?: boolean;
  apiMode?: "openai" | "anthropic";
}

/** Compatibility config slice attached to API responses. */
export interface ModelConfigSpec {
  displayName?: string;
  family?: string;
  ownedBy?: string;
  apiMode?: "openai" | "anthropic";
  vision?: boolean;
  thinking?: { levels: string[] };
  reasoning?: ModelConfigReasoning;
}

export interface ModelWithSyncStatus {
  modelName: string;
  status: ModelSyncPresenceStatus;
  enabled?: boolean;
  modelRoute: ModelRoute;
  config?: ModelConfigSpec;
}

export interface ModelSyncDiffItem {
  modelName: string;
  field: ModelSyncField;
  configValue: unknown;
  registryValue: unknown;
  defaultDirection: ModelSyncDirection;
}

export interface ModelSyncSelection {
  modelName: string;
  field: ModelSyncField;
  direction: ModelSyncDirection;
}

export interface ModelsWithConfigCounts {
  synced: number;
  configOnly: number;
  registryOnly: number;
  total: number;
}

export interface ModelsWithConfigResponse {
  models: ModelWithSyncStatus[];
  counts: ModelsWithConfigCounts;
}

/** Map legacy API status labels to current names. */
export function normalizeSyncPresenceStatus(
  status: string,
): ModelSyncPresenceStatus {
  if (status === "litellm-only") {
    return "registry-only";
  }
  return status as ModelSyncPresenceStatus;
}

/** Map legacy sync direction labels to current names. */
export function normalizeSyncDirection(direction: string): ModelSyncDirection {
  if (direction === "config-to-litellm") {
    return "config-to-registry";
  }
  if (direction === "litellm-to-config") {
    return "registry-to-config";
  }
  return direction as ModelSyncDirection;
}
