import type { AgentRoutingAPIResponse } from "../../lib/api-client";
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from "../../types/agent-routing";

const AGENT_KEYS = AGENT_DEFINITIONS.map((a) => a.key);
const CATEGORY_KEYS = CATEGORY_DEFINITIONS.map((c) => c.key);

function isAgentKey(key: string): boolean {
  const prefix = key.includes("/") ? key.split("/")[0] : key;
  return AGENT_KEYS.includes(prefix);
}

function isCategoryKey(key: string): boolean {
  const prefix = key.includes("/") ? key.split("/")[0] : key;
  return CATEGORY_KEYS.includes(prefix);
}

export type AliasEntry = {
  key: string;
  value: string;
};

export type AliasGroup = {
  type: "agent" | "category" | "custom";
  key: string;
  name: string;
  icon?: string;
  directAlias?: AliasEntry;
  aliases?: AliasEntry[];
  subgroups?: Array<{
    key: string;
    name: string;
    aliases: AliasEntry[];
  }>;
};

export function getAliasesGrouped(
  aliases: AgentRoutingAPIResponse | undefined,
): AliasGroup[] {
  if (!aliases) return [];

  const agentMap: Map<string, AliasEntry[]> = new Map();
  const categoryMap: Map<string, AliasEntry[]> = new Map();
  const customEntries: AliasEntry[] = [];

  for (const [k, v] of Object.entries(aliases)) {
    if (isAgentKey(k)) {
      const prefix = k.includes("/") ? k.split("/")[0] : k;
      if (!agentMap.has(prefix)) agentMap.set(prefix, []);
      agentMap.get(prefix)?.push({ key: k, value: v });
    } else if (isCategoryKey(k)) {
      const prefix = k.includes("/") ? k.split("/")[0] : k;
      if (!categoryMap.has(prefix)) categoryMap.set(prefix, []);
      categoryMap.get(prefix)?.push({ key: k, value: v });
    } else {
      customEntries.push({ key: k, value: v });
    }
  }

  customEntries.sort((a, b) => a.key.localeCompare(b.key));

  const groups: AliasGroup[] = [];

  if (agentMap.size > 0) {
    const subgroups: AliasGroup["subgroups"] = [];
    for (const key of AGENT_KEYS) {
      const entries = agentMap.get(key);
      if (!entries?.length) continue;
      const def = AGENT_DEFINITIONS.find((a) => a.key === key);
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
    const subgroups: AliasGroup["subgroups"] = [];
    for (const key of CATEGORY_KEYS) {
      const entries = categoryMap.get(key);
      if (!entries?.length) continue;
      const def = CATEGORY_DEFINITIONS.find((c) => c.key === key);
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
  aliases: AgentRoutingAPIResponse | undefined,
): [string, string][] {
  if (!aliases) return [];

  const agentEntries: [string, string][] = [];
  const categoryEntries: [string, string][] = [];
  const customEntries: [string, string][] = [];

  for (const entry of Object.entries(aliases)) {
    if (isAgentKey(entry[0])) agentEntries.push(entry);
    else if (isCategoryKey(entry[0])) categoryEntries.push(entry);
    else customEntries.push(entry);
  }

  customEntries.sort((a, b) => a[0].localeCompare(b[0]));

  const sorted: [string, string][] = [];
  for (const key of AGENT_KEYS) {
    for (const [k, v] of agentEntries) {
      if (k === key || k.startsWith(`${key}/`)) sorted.push([k, v]);
    }
  }
  for (const key of CATEGORY_KEYS) {
    for (const [k, v] of categoryEntries) {
      if (k === key || k.startsWith(`${key}/`)) sorted.push([k, v]);
    }
  }
  for (const entry of customEntries) sorted.push(entry);

  return sorted;
}
