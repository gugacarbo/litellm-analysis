import type { ModelSlotNames } from "./generate";
import { DEFAULT_MODEL_NAMES } from "./generate";

/**
 * Check if a model string is a logical model reference for the given key.
 * A logical model reference has the format "key/<slotName>" where slotName
 * is one of the modelNames (e.g. "key/gpt-5.5").
 *
 * @param modelNames Logical slot names the caller is using (defaults to gpt-5.5..gpt-5.1).
 *        Must come from the caller's context.
 */
export function isLogicalModelForKey(
  key: string,
  model: string,
  modelNames: ModelSlotNames = DEFAULT_MODEL_NAMES,
): boolean {
  const prefix = `${key}/`;
  if (!model.startsWith(prefix)) {
    return false;
  }
  const suffix = model.slice(prefix.length);
  return (modelNames as readonly string[]).includes(suffix);
}

/**
 * Resolve a model value using aliases if it's a logical model reference.
 * If the value is a logical model reference (e.g., "sisyphus/gpt-5.5"),
 * resolve it using the existing aliases map.
 * Otherwise, return the value as-is.
 */
export function resolveModelValue(
  key: string,
  value: string,
  existingAliases: Record<string, string>,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (isLogicalModelForKey(key, trimmed)) {
    return existingAliases[trimmed] ?? "";
  }

  return trimmed;
}

/** Resolve configured primary and global fallback model aliases. */
export function resolveConfiguredModels(
  key: string,
  model: string,
  globalFallbackModel: string | undefined,
  existingAliases: Record<string, string>,
): {
  actualModel: string;
  actualGlobalFallbackModel: string;
} {
  const actualModel = resolveModelValue(key, model, existingAliases);
  const actualGlobalFallbackModel = resolveModelValue(
    key,
    globalFallbackModel || "",
    existingAliases,
  );

  return { actualModel, actualGlobalFallbackModel };
}
