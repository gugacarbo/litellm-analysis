import { stripLitellmPrefix } from "./utils/strip-prefix";

export type ModelSlotNames = readonly string[];

function normalizeModel(value: string | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }
  return stripLitellmPrefix(trimmed);
}

/** Resolve which backend model id fills a logical slot (primary + fallbacks). */
export function resolveSlotModelId(
  slotIndex: number,
  slotCount: number,
  primaryModelId: string,
  globalFallbackModelId: string | undefined,
): string {
  const primary = (primaryModelId || "").trim();
  const fallback = (globalFallbackModelId || "").trim();

  if (slotIndex === 0) {
    return primary || fallback;
  }

  if (slotIndex === slotCount - 1) {
    return fallback;
  }

  return fallback;
}

function resolveSlotModel(
  slotIndex: number,
  slotCount: number,
  primaryModel: string,
  globalFallbackModel: string,
): string {
  return resolveSlotModelId(
    slotIndex,
    slotCount,
    primaryModel,
    globalFallbackModel,
  );
}

/**
 * Generate litellm aliases for an agent/category key using logical slot names.
 * Slots map: modelNames[0] = primary, middle = fallbacks, last = global fallback.
 *
 * @param modelNames Logical slot names to generate.
 *        Must come from the caller's context (plugin config, routing config, etc.)
 */
export function generateLitellmAliases(
  key: string,
  model: string,
  globalFallbackModel: string | undefined,
  modelNames: ModelSlotNames,
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
