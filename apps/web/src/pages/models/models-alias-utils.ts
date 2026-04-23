import type { AgentRoutingAPIResponse } from '../../lib/api-client';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from '../../types/agent-routing';

const AGENT_KEYS = AGENT_DEFINITIONS.map((a) => a.key);
const CATEGORY_KEYS = CATEGORY_DEFINITIONS.map((c) => c.key);

function isAgentKey(key: string): boolean {
  const prefix = key.includes('/') ? key.split('/')[0] : key;
  return AGENT_KEYS.includes(prefix);
}

function isCategoryKey(key: string): boolean {
  const prefix = key.includes('/') ? key.split('/')[0] : key;
  return CATEGORY_KEYS.includes(prefix);
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
