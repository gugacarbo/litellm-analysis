/**
 * Escape special regex characters in a string.
 */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Generate a regex pattern to match aliases starting with the given key prefix.
 */
export function generateAliasCleanupPattern(key) {
  return new RegExp(`^${escapeRegExp(key)}/`);
}
