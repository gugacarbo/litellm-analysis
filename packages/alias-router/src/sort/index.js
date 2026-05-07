import { AGENT_KEYS, CATEGORY_KEYS } from "../constants/model-names.js";
/**
 * Sort aliases so that:
 * 1. Agent aliases come first, in AGENT_KEYS definition order
 * 2. Category aliases follow, in CATEGORY_KEYS definition order
 * 3. Custom aliases come last, sorted alphabetically
 *
 * Within each agent/category group, the base key (e.g. "sisyphus") comes before
 * prefixed keys (e.g. "sisyphus/gpt-5.4"), and prefixed keys retain insertion order.
 */
export function sortAliasesByDefinitionOrder(aliases) {
  const agentKeySet = new Set(AGENT_KEYS);
  const categoryKeySet = new Set(CATEGORY_KEYS);
  const agentAliases = [];
  const categoryAliases = [];
  const customAliases = [];
  for (const [key, value] of Object.entries(aliases)) {
    if (agentKeySet.has(key) || key.includes("/")) {
      const prefix = key.includes("/") ? key.split("/")[0] : key;
      if (agentKeySet.has(prefix)) {
        agentAliases.push([key, value]);
        continue;
      }
    }
    if (categoryKeySet.has(key) || key.includes("/")) {
      const prefix = key.includes("/") ? key.split("/")[0] : key;
      if (categoryKeySet.has(prefix)) {
        categoryAliases.push([key, value]);
        continue;
      }
    }
    customAliases.push([key, value]);
  }
  customAliases.sort((a, b) => a[0].localeCompare(b[0]));
  const sorted = {};
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
