import { MODEL_NAMES } from "../constants/model-names.js";
import { stripLitellmPrefix } from "../utils/strip-prefix.js";

function normalizeModel(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }
  return stripLitellmPrefix(trimmed);
}
function getLastDefinedFallback(fallbackModels) {
  for (let i = fallbackModels.length - 1; i >= 0; i--) {
    if (fallbackModels[i]) {
      return fallbackModels[i];
    }
  }
  return "";
}
function resolveSlotModel(
  slotIndex,
  primaryModel,
  fallbackModels,
  globalFallbackModel,
) {
  // Primary alias (gpt-5.5): prefer explicit model, then global fallback.
  if (slotIndex === 0) {
    return primaryModel || globalFallbackModel;
  }
  // Global fallback alias (gpt-5.1): global fallback always wins.
  if (slotIndex === MODEL_NAMES.length - 1) {
    return globalFallbackModel || getLastDefinedFallback(fallbackModels);
  }
  // Middle fallback slots (gpt-5.4, gpt-5.3, gpt-5.2):
  // use explicit fallback by index, otherwise global fallback.
  const fallbackByIndex = fallbackModels[slotIndex - 1] || "";
  return fallbackByIndex || globalFallbackModel;
}
/**
 * Generate litellm aliases for an agent/category key.
 * Generates aliases for gpt-5.5 through gpt-5.1 using real model names:
 * - gpt-5.5: primary model
 * - gpt-5.4, gpt-5.3, gpt-5.2: fallback_models[0..2]
 * - gpt-5.1: global fallback
 *
 * If any slot is missing, it falls back to global fallback model.
 */
export function generateLitellmAliases(
  key,
  model,
  fallback_models,
  globalFallbackModel,
) {
  const aliases = {};
  const normalizedModel = normalizeModel(model);
  const normalizedFallbacks = (fallback_models || []).map(normalizeModel);
  const normalizedGlobalFallback = normalizeModel(globalFallbackModel);
  for (let i = 0; i < MODEL_NAMES.length; i++) {
    const resolvedModel = resolveSlotModel(
      i,
      normalizedModel,
      normalizedFallbacks,
      normalizedGlobalFallback,
    );
    if (!resolvedModel) {
      continue;
    }
    aliases[`${key}/${MODEL_NAMES[i]}`] = resolvedModel;
  }
  return aliases;
}
