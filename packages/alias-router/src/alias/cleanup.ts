import { generateAliasCleanupPattern } from '../utils/regex.js';

/**
 * Generate all aliases that should be removed when changing/clearing a key's configuration.
 * This includes the primary alias and all fallback aliases.
 *
 * @param key - The agent or category key
 * @param existingAliases - Current alias map to scan for matching entries
 * @returns Array of alias keys that belong to this agent/category
 */
export function getExistingAliasesForAgent(
  key: string,
  existingAliases: Record<string, string>,
): string[] {
  const pattern = generateAliasCleanupPattern(key);
  return Object.keys(existingAliases).filter((alias) => pattern.test(alias));
}

/**
 * Clean old aliases for a key and merge in new ones.
 *
 * @param existingAliases - Current litellm model_group_alias map
 * @param key - The agent or category key being updated
 * @param newAliases - New aliases to merge in (from generateLitellmAliases)
 * @returns Updated alias map with old entries for this key removed and new ones added
 */
export function replaceAliasesForAgent(
  existingAliases: Record<string, string>,
  key: string,
  newAliases: Record<string, string>,
): Record<string, string> {
  const cleaned = { ...existingAliases };

  // Remove old aliases for this key
  const oldKeys = getExistingAliasesForAgent(key, cleaned);
  for (const k of oldKeys) {
    delete cleaned[k];
  }

  // Merge new aliases
  for (const [k, v] of Object.entries(newAliases)) {
    cleaned[k] = v;
  }

  return cleaned;
}
