import { escapeRegExp } from '../utils/regex.js';

/**
 * Check if a model string is a logical model reference for the given key.
 * A logical model reference has the format "key/gpt-5.X" where X is 1-5.
 */
export function isLogicalModelForKey(key: string, model: string): boolean {
  const pattern = new RegExp(`^${escapeRegExp(key)}/gpt-5\\.[1-5]$`);
  return pattern.test(model);
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
    return '';
  }

  if (isLogicalModelForKey(key, trimmed)) {
    return existingAliases[trimmed] ?? '';
  }

  return trimmed;
}

/**
 * Resolve configured models (primary and fallbacks) using aliases.
 * If any model is a logical reference (e.g., "sisyphus/gpt-5.5"), resolve it.
 * Filter out empty values from the resolved fallbacks.
 */
export function resolveConfiguredModels(
  key: string,
  model: string,
  fallbackModels: string[] | undefined,
  existingAliases: Record<string, string>,
): { actualModel: string; actualFallbacks: string[] } {
  const actualModel = resolveModelValue(key, model, existingAliases);
  const actualFallbacks = (fallbackModels || [])
    .map((fallback) => resolveModelValue(key, fallback, existingAliases))
    .filter((fallback) => Boolean(fallback));

  return { actualModel, actualFallbacks };
}
