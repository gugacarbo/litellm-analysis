import { stripLitellmPrefix } from "../utils/strip-prefix";

export type ModelSlotNames = readonly string[];

/** Logical slot names for primary + fallback aliases (default: gpt-5.5..gpt-5.1). */
export const DEFAULT_MODEL_NAMES: ModelSlotNames = [
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.3",
] as const;

function normalizeModel(value: string | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }
  return stripLitellmPrefix(trimmed);
}

function resolveSlotModel(
  slotIndex: number,
  slotCount: number,
  primaryModel: string,
  globalFallbackModel: string,
): string {
  // Primary alias: prefer explicit model, then global fallback.
  if (slotIndex === 0) {
    return primaryModel || globalFallbackModel;
  }

  // Global fallback alias (last slot): global fallback always wins.
  if (slotIndex === slotCount - 1) {
    return globalFallbackModel;
  }

  // Middle fallback slots always point to the global fallback.
  return globalFallbackModel;
}

/**
 * Generate litellm aliases for an agent/category key using logical slot names.
 * Slots map: modelNames[0] = primary, middle = fallbacks, last = global fallback.
 *
 * @param modelNames Logical slot names to generate (defaults to gpt-5.5..gpt-5.1).
 *        Must come from the caller's context (plugin config, routing config, etc.)
 */
export function generateLitellmAliases(
  key: string,
  model: string,
  globalFallbackModel?: string,
  modelNames: ModelSlotNames = DEFAULT_MODEL_NAMES,
): Record<string, string> {
  const aliases: Record<string, string> = {};
  const normalizedModel = normalizeModel(model);
  const normalizedGlobalFallback = normalizeModel(globalFallbackModel);

  for (let i = 0; i < modelNames.length; i++) {
    const resolvedModel = resolveSlotModel(
      i,
      modelNames.length,
      normalizedModel,
      normalizedGlobalFallback,
    );
    if (!resolvedModel) {
      continue;
    }
    aliases[`${key}/${modelNames[i]}`] = resolvedModel;
  }

  return aliases;
}
