function stripLitellmPrefix(model: string): string {
  if (model.startsWith('litellm/')) {
    return model.slice(8);
  }
  return model;
}

/** Model names for primary, fallback slots, and global fallback (max 5 total: 1 primary + 3 fallbacks + 1 global). */
const MODEL_NAMES = ['gpt-5.5', 'gpt-5.4', 'gpt-5.3', 'gpt-5.2', 'gpt-5.1'] as const;

export function generateLitellmAliases(
  key: string,
  model: string,
  fallback_models?: string[],
  globalFallbackModel?: string,
): Record<string, string> {
  const aliases: Record<string, string> = {};

  if (model) {
    aliases[`${key}/${MODEL_NAMES[0]}`] = stripLitellmPrefix(model);
  }

  if (fallback_models && fallback_models.length > 0) {
    const maxFallbacks = Math.min(fallback_models.length, 3);
    for (let i = 0; i < maxFallbacks; i++) {
      aliases[`${key}/${MODEL_NAMES[i + 1]}`] = stripLitellmPrefix(
        fallback_models[i],
      );
    }
  }

  // Global fallback model: appended after all agent-specific fallbacks (always gpt-5.1)
  if (globalFallbackModel) {
    aliases[`${key}/${MODEL_NAMES[4]}`] = stripLitellmPrefix(globalFallbackModel);
  }

  return aliases;
}

export function generateAliasCleanupPattern(key: string): RegExp {
  return new RegExp(`^${key}/`);
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLogicalModelForKey(key: string, model: string): boolean {
  const pattern = new RegExp(`^${escapeRegExp(key)}/gpt-5\\.[1-5]$`);
  return pattern.test(model);
}

function resolveModelValue(
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

/**
 * Agent keys in the exact order they appear in the UI (matches AGENT_DEFINITIONS).
 * Must stay in sync with the frontend definition order.
 */
export const AGENT_KEYS = [
  'sisyphus',
  'oracle',
  'prometheus',
  'explore',
  'multimodal-looker',
  'metis',
  'atlas',
  'librarian',
  'sisyphus-junior',
  'momus',
  'hephaestus',
] as const;

/**
 * Category keys in the exact order they appear in the UI (matches CATEGORY_DEFINITIONS).
 * Must stay in sync with the frontend definition order.
 */
export const CATEGORY_KEYS = [
  'visual-engineering',
  'ultrabrain',
  'deep',
  'artistry',
  'quick',
  'unspecified-low',
  'unspecified-high',
  'writing',
] as const;

/**
 * Sort aliases so that:
 * 1. Agent aliases come first, in AGENT_KEYS definition order
 * 2. Category aliases follow, in CATEGORY_KEYS definition order
 * 3. Custom aliases come last, sorted alphabetically
 *
 * Within each agent/category group, the base key (e.g. "sisyphus") comes before
 * prefixed keys (e.g. "sisyphus/gpt-5.4"), and prefixed keys retain insertion order.
 */
export function sortAliasesByDefinitionOrder(
  aliases: Record<string, string>,
): Record<string, string> {
  const agentKeySet: Set<string> = new Set(AGENT_KEYS);
  const categoryKeySet: Set<string> = new Set(CATEGORY_KEYS);

  const agentAliases: [string, string][] = [];
  const categoryAliases: [string, string][] = [];
  const customAliases: [string, string][] = [];

  for (const [key, value] of Object.entries(aliases)) {
    if (agentKeySet.has(key) || key.includes('/')) {
      const prefix = key.includes('/') ? key.split('/')[0] : key;
      if (agentKeySet.has(prefix)) {
        agentAliases.push([key, value]);
        continue;
      }
    }
    if (categoryKeySet.has(key) || key.includes('/')) {
      const prefix = key.includes('/') ? key.split('/')[0] : key;
      if (categoryKeySet.has(prefix)) {
        categoryAliases.push([key, value]);
        continue;
      }
    }
    customAliases.push([key, value]);
  }

  customAliases.sort((a, b) => a[0].localeCompare(b[0]));

  const sorted: Record<string, string> = {};
  for (const key of AGENT_KEYS) {
    for (const [k, v] of agentAliases) {
      if (k === key || k.startsWith(`${key}/`)) {
        sorted[k] = v;
      }
    }
  }
  for (const key of CATEGORY_KEYS) {
    for (const [k, v] of categoryAliases) {
      if (k === key || k.startsWith(`${key}/`)) {
        sorted[k] = v;
      }
    }
  }
  for (const [k, v] of customAliases) {
    sorted[k] = v;
  }

  return sorted;
}
