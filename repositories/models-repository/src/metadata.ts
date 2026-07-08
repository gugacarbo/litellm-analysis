import type { ModelSpec } from "./schemas/model";
import type { ReasoningConfig } from "./schemas/thinking";

export interface ModelMetadata {
  reasoning?: ReasoningConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function metadataFromModelSpec(spec: ModelSpec): ModelMetadata | null {
  const metadata: ModelMetadata = {};

  if (spec.reasoning !== undefined) {
    metadata.reasoning = spec.reasoning;
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

export function applyMetadataToModelSpec(
  spec: ModelSpec,
  metadata: unknown,
): ModelSpec {
  if (!isRecord(metadata)) {
    return spec;
  }

  const next = { ...spec };

  if (metadata.reasoning !== undefined && isRecord(metadata.reasoning)) {
    next.reasoning = metadata.reasoning as ReasoningConfig;
  }

  return next;
}
