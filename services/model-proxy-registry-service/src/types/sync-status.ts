/**
 * Sync presence and direction types for models.jsonc ↔ model_proxy_models.
 * Replaces legacy LiteLLM naming in Batch 3.
 *
 * @see docs/batch-3-field-mapping.md
 */

import type { ModelRoute } from "./model-route.js";

/** Where a model exists relative to registry and models.jsonc. */
export type ModelSyncPresenceStatus =
  | "synced"
  | "config-only"
  | "registry-only";

/** Direction for resolving a field mismatch during sync-batch. */
export type ModelSyncDirection = "config-to-registry" | "registry-to-config";

/** @deprecated Use `registry-only` — API shim for one release. */
export type LegacyModelSyncPresenceStatus = "litellm-only";

/** @deprecated Use `config-to-registry` / `registry-to-config`. */
export type LegacyModelSyncDirection =
  | "config-to-litellm"
  | "litellm-to-config";

/** Union accepted on API input during transition. */
export type ModelSyncPresenceStatusInput =
  | ModelSyncPresenceStatus
  | LegacyModelSyncPresenceStatus;

export type ModelSyncDirectionInput =
  | ModelSyncDirection
  | LegacyModelSyncDirection;

/** Fields compared between models.jsonc and registry route. */
export type ModelSyncField =
  | "model_presence"
  | "enabled"
  | "context_window_size"
  | "max_tokens"
  | "input_cost_per_token"
  | "output_cost_per_token";

/** Reasoning/thinking metadata — stays in models.jsonc in Batch 3. */
export interface ModelConfigReasoning {
  effort?: "low" | "medium" | "high" | "xhigh";
  enableThinking?: boolean;
  includeReasoningInRequest?: boolean;
  apiMode?: "openai" | "anthropic";
}

/** models.jsonc `ModelSpec` slice attached to API responses. */
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
  /** @deprecated Response alias — same payload as modelRoute in snake_case via adapter. */
  litellmParams?: Record<string, unknown>;
  config?: ModelConfigSpec;
}

export interface ModelSyncDiffItem {
  modelName: string;
  field: ModelSyncField;
  configValue: unknown;
  /** Registry / modelRoute value (was `litellmValue` in legacy API). */
  registryValue: unknown;
  defaultDirection: ModelSyncDirection;
}

export interface ModelSyncSelection {
  modelName: string;
  field: ModelSyncField;
  direction: ModelSyncDirectionInput;
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

/** Map legacy API status labels to Batch 3 names. */
export function normalizeSyncPresenceStatus(
  status: ModelSyncPresenceStatusInput,
): ModelSyncPresenceStatus {
  if (status === "litellm-only") {
    return "registry-only";
  }
  return status;
}

/** Map legacy sync direction labels to Batch 3 names. */
export function normalizeSyncDirection(
  direction: ModelSyncDirectionInput,
): ModelSyncDirection {
  if (direction === "config-to-litellm") {
    return "config-to-registry";
  }
  if (direction === "litellm-to-config") {
    return "registry-to-config";
  }
  return direction;
}
