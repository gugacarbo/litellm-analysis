import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

export type AgentRoutingAPIResponse = Record<string, string>;

function isAgentKey(key: string, agentIds: readonly string[]): boolean {
  const prefix = key.includes("/") ? key.split("/")[0] : key;
  return agentIds.includes(prefix);
}

function isCategoryKey(key: string, categoryKeys: readonly string[]): boolean {
  const prefix = key.includes("/") ? key.split("/")[0] : key;
  return categoryKeys.includes(prefix);
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
  agents: readonly SystemAgent[] = [],
  categories: readonly string[] = [],
): AliasGroup[] {
  if (!aliases) return [];

  const agentIds = agents.map((a) => a.id);

  const agentMap: Map<string, AliasEntry[]> = new Map();
  const categoryMap: Map<string, AliasEntry[]> = new Map();
  const customEntries: AliasEntry[] = [];

  for (const [k, v] of Object.entries(aliases)) {
    if (isAgentKey(k, agentIds)) {
      const prefix = k.includes("/") ? k.split("/")[0] : k;
      if (!agentMap.has(prefix)) agentMap.set(prefix, []);
      agentMap.get(prefix)?.push({ key: k, value: v });
    } else if (isCategoryKey(k, categories)) {
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
    for (const id of agentIds) {
      const entries = agentMap.get(id);
      if (!entries?.length) continue;
      const agent = agents.find((a) => a.id === id);
      const direct = entries.find((e) => e.key === id);
      const nested = entries
        .filter((e) => e.key !== id)
        .sort((a, b) => a.key.localeCompare(b.key));
      subgroups.push({
        key: id,
        name: agent?.displayName ?? id,
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
    for (const key of categories) {
      const entries = categoryMap.get(key);
      if (!entries?.length) continue;
      const direct = entries.find((e) => e.key === key);
      const nested = entries
        .filter((e) => e.key !== key)
        .sort((a, b) => a.key.localeCompare(b.key));
      subgroups.push({
        key,
        name: key,
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

export function getAllAliasesSorted(
  aliases: AgentRoutingAPIResponse | undefined,
  agents: readonly SystemAgent[] = [],
  categories: readonly string[] = [],
): [string, string][] {
  if (!aliases) return [];

  const agentIds = agents.map((a) => a.id);

  const agentEntries: [string, string][] = [];
  const categoryEntries: [string, string][] = [];
  const customEntries: [string, string][] = [];

  for (const [k, v] of Object.entries(aliases)) {
    if (isAgentKey(k, agentIds)) agentEntries.push([k, v]);
    else if (isCategoryKey(k, categories)) categoryEntries.push([k, v]);
    else customEntries.push([k, v]);
  }

  customEntries.sort((a, b) => a[0].localeCompare(b[0]));

  const sorted: [string, string][] = [];
  for (const id of agentIds) {
    for (const [k, v] of agentEntries) {
      if (k === id || k.startsWith(`${id}/`)) sorted.push([k, v]);
    }
  }
  for (const key of categories) {
    for (const [k, v] of categoryEntries) {
      if (k === key || k.startsWith(`${key}/`)) sorted.push([k, v]);
    }
  }
  for (const entry of customEntries) sorted.push(entry);

  return sorted;
}
