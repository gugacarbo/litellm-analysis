import { MODEL_NAMES } from "../constants/model-names.js";
import { stripLitellmPrefix } from "../utils/strip-prefix.js";

/**
 * Generate litellm aliases for an agent/category key.
 * Always generates all 5 aliases (gpt-5.5 through gpt-5.1):
 * - gpt-5.5 → primary model
 * - gpt-5.4, gpt-5.3, gpt-5.2 → from fallback_models (if available, in order)
 * - gpt-5.1 → global fallback (if defined), otherwise falls back to the last available fallback_models entry
 */
export function generateLitellmAliases(
  key: string,
  model: string,
  fallback_models?: string[],
  globalFallbackModel?: string,
): Record<string, string> {
  const aliases: Record<string, string> = {};

  // Primary model: gpt-5.5
  if (model) {
    aliases[`${key}/${MODEL_NAMES[0]}`] = stripLitellmPrefix(model);
  }

  // Fallback models: gpt-5.4, gpt-5.3, gpt-5.2
  if (fallback_models && fallback_models.length > 0) {
    const maxFallbacks = Math.min(fallback_models.length, 3);
    for (let i = 0; i < maxFallbacks; i++) {
      aliases[`${key}/${MODEL_NAMES[i + 1]}`] = stripLitellmPrefix(
        fallback_models[i],
      );
    }
  }

  // Global fallback slot (gpt-5.1):
  // - If globalFallbackModel is defined, use it
  // - Otherwise, use the last entry from fallback_models (if available)
  const gpt51Value = globalFallbackModel
    ? stripLitellmPrefix(globalFallbackModel)
    : fallback_models && fallback_models.length > 0
      ? stripLitellmPrefix(fallback_models[fallback_models.length - 1])
      : "";

  if (gpt51Value) {
    aliases[`${key}/${MODEL_NAMES[4]}`] = gpt51Value;
  }

  return aliases;
}
