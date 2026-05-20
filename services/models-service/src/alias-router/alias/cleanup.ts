import { generateAliasCleanupPattern } from "../utils/regex";

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

export interface ManagedAliasReconcileResult {
  aliases: Record<string, string>;
  managedAliasKeys: string[];
}

function getAliasSuffix(aliasKey: string): string {
  const slashIndex = aliasKey.indexOf("/");
  if (slashIndex <= 0) {
    return "";
  }
  return aliasKey.slice(slashIndex + 1);
}

function inferPreviouslyManagedAliasKeys(
  existingAliases: Record<string, string>,
  nextManagedAliasKeys: readonly string[],
): string[] {
  const slotNames = new Set(
    nextManagedAliasKeys
      .map((key) => getAliasSuffix(key))
      .filter((slot) => slot.length > 0),
  );

  if (slotNames.size === 0) {
    return [];
  }

  return Object.keys(existingAliases).filter((key) => {
    const suffix = getAliasSuffix(key);
    return Boolean(suffix) && slotNames.has(suffix);
  });
}

/**
 * Reconcile aliases managed by the agent/category plugin.
 *
 * Preserves all non-managed aliases, removes stale managed aliases that are
 * no longer present, and upserts the latest managed aliases.
 */
export function reconcileManagedAliases(
  existingAliases: Record<string, string>,
  nextManagedAliases: Record<string, string>,
  previouslyManagedAliasKeys: readonly string[] = [],
): ManagedAliasReconcileResult {
  const reconciled = { ...existingAliases };
  const nextManagedEntries = Object.entries(nextManagedAliases).filter(
    ([, value]) => value !== "",
  );
  const nextManagedKeySet = new Set(nextManagedEntries.map(([key]) => key));
  const previousManagedKeys =
    previouslyManagedAliasKeys.length > 0
      ? previouslyManagedAliasKeys
      : inferPreviouslyManagedAliasKeys(
          existingAliases,
          Array.from(nextManagedKeySet),
        );

  for (const key of previousManagedKeys) {
    if (!nextManagedKeySet.has(key)) {
      delete reconciled[key];
    }
  }

  for (const [key, value] of nextManagedEntries) {
    reconciled[key] = value;
  }

  return {
    aliases: reconciled,
    managedAliasKeys: Array.from(nextManagedKeySet).sort((a, b) =>
      a.localeCompare(b),
    ),
  };
}
