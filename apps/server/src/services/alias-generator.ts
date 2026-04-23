function stripLitellmPrefix(model: string): string {
  if (model.startsWith('litellm/')) {
    return model.slice(8);
  }
  return model;
}

export function generateLitellmAliases(
  key: string,
  model: string,
  fallback_models?: string[],
): Record<string, string> {
  const aliases: Record<string, string> = {};

  if (model) {
    aliases[`${key}/gpt-5.4`] = stripLitellmPrefix(model);
  }

  if (fallback_models && fallback_models.length > 0) {
    fallback_models.forEach((fm, index) => {
      aliases[`${key}_fallback_${index + 1}/gpt-5.4`] = stripLitellmPrefix(fm);
    });
  }

  return aliases;
}

export function generateAliasCleanupPattern(key: string): RegExp {
  return new RegExp(`^${key}/gpt-5.4$`);
}

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
