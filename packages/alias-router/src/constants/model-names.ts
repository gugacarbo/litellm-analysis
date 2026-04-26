/**
 * Model names for primary and fallback slots (always generates all 5: gpt-5.5 through gpt-5.1).
 */
export const MODEL_NAMES = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.3',
  'gpt-5.2',
  'gpt-5.1',
] as const;

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
