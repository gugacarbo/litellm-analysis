import type { AgentRoutingAPIResponse } from '../../lib/api-client';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from '../../types/agent-routing';

const KNOWN_ALIAS_KEYS = new Set([
  ...AGENT_DEFINITIONS.map((a) => a.key),
  ...CATEGORY_DEFINITIONS.map((c) => c.key),
]);

const KNOWN_ALIAS_PREFIXES = [
  ...AGENT_DEFINITIONS.map((a) => `${a.key}/`),
  ...CATEGORY_DEFINITIONS.map((c) => `${c.key}/`),
];

export function getCustomAliases(aliases: AgentRoutingAPIResponse | undefined) {
  if (!aliases) return [];

  return Object.entries(aliases).filter(([key]) => {
    if (KNOWN_ALIAS_KEYS.has(key)) return false;
    return !KNOWN_ALIAS_PREFIXES.some((prefix) => key.startsWith(prefix));
  });
}
