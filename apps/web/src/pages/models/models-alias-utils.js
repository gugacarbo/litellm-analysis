import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from "@lite-llm/api-contracts/agent-routing";

function isAgentKey(key, agentKeys) {
  const prefix = key.includes("/") ? key.split("/")[0] : key;
  return agentKeys.includes(prefix);
}
function isCategoryKey(key, categoryKeys) {
  const prefix = key.includes("/") ? key.split("/")[0] : key;
  return categoryKeys.includes(prefix);
}
export function getAliasesGrouped(
  aliases,
  agents = AGENT_DEFINITIONS,
  categories = CATEGORY_DEFINITIONS,
) {
  if (!aliases) return [];
  const agentKeys = agents.map((a) => a.key);
  const categoryKeys = categories.map((c) => c.key);
  const agentMap = new Map();
  const categoryMap = new Map();
  const customEntries = [];
  for (const [k, v] of Object.entries(aliases)) {
    if (isAgentKey(k, agentKeys)) {
      const prefix = k.includes("/") ? k.split("/")[0] : k;
      if (!agentMap.has(prefix)) agentMap.set(prefix, []);
      agentMap.get(prefix)?.push({ key: k, value: v });
    } else if (isCategoryKey(k, categoryKeys)) {
      const prefix = k.includes("/") ? k.split("/")[0] : k;
      if (!categoryMap.has(prefix)) categoryMap.set(prefix, []);
      categoryMap.get(prefix)?.push({ key: k, value: v });
    } else {
      customEntries.push({ key: k, value: v });
    }
  }
  customEntries.sort((a, b) => a.key.localeCompare(b.key));
  const groups = [];
  if (agentMap.size > 0) {
    const subgroups = [];
    for (const key of agentKeys) {
      const entries = agentMap.get(key);
      if (!entries?.length) continue;
      const def = agents.find((a) => a.key === key);
      const direct = entries.find((e) => e.key === key);
      const nested = entries
        .filter((e) => e.key !== key)
        .sort((a, b) => a.key.localeCompare(b.key));
      subgroups.push({
        key,
        name: def?.name ?? key,
        aliases: nested,
      });
      if (direct) {
        subgroups[subgroups.length - 1].aliases.unshift(direct);
      }
    }
    if (subgroups.length > 0) {
      groups.push({
        type: "agent",
        key: "agents",
        name: "Agents",
        subgroups,
      });
    }
  }
  if (categoryMap.size > 0) {
    const subgroups = [];
    for (const key of categoryKeys) {
      const entries = categoryMap.get(key);
      if (!entries?.length) continue;
      const def = categories.find((c) => c.key === key);
      const direct = entries.find((e) => e.key === key);
      const nested = entries
        .filter((e) => e.key !== key)
        .sort((a, b) => a.key.localeCompare(b.key));
      subgroups.push({
        key,
        name: def?.name ?? key,
        aliases: nested,
      });
      if (direct) {
        subgroups[subgroups.length - 1].aliases.unshift(direct);
      }
    }
    if (subgroups.length > 0) {
      groups.push({
        type: "category",
        key: "categories",
        name: "Categories",
        subgroups,
      });
    }
  }
  if (customEntries.length > 0) {
    groups.push({
      type: "custom",
      key: "custom",
      name: "Custom",
      aliases: customEntries,
    });
  }
  return groups;
}
/**
 * Returns all aliases sorted by:
 * 1. Agent aliases first, in AGENT_DEFINITIONS UI order
 * 2. Category aliases next, in CATEGORY_DEFINITIONS UI order
 * 3. Custom aliases last, sorted alphabetically
 */
export function getAllAliasesSorted(
  aliases,
  agents = AGENT_DEFINITIONS,
  categories = CATEGORY_DEFINITIONS,
) {
  if (!aliases) return [];
  const agentKeys = agents.map((a) => a.key);
  const categoryKeys = categories.map((c) => c.key);
  const agentEntries = [];
  const categoryEntries = [];
  const customEntries = [];
  for (const entry of Object.entries(aliases)) {
    if (isAgentKey(entry[0], agentKeys)) agentEntries.push(entry);
    else if (isCategoryKey(entry[0], categoryKeys)) categoryEntries.push(entry);
    else customEntries.push(entry);
  }
  customEntries.sort((a, b) => a[0].localeCompare(b[0]));
  const sorted = [];
  for (const key of agentKeys) {
    for (const [k, v] of agentEntries) {
      if (k === key || k.startsWith(`${key}/`)) sorted.push([k, v]);
    }
  }
  for (const key of categoryKeys) {
    for (const [k, v] of categoryEntries) {
      if (k === key || k.startsWith(`${key}/`)) sorted.push([k, v]);
    }
  }
  for (const entry of customEntries) sorted.push(entry);
  return sorted;
}
