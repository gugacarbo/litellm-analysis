import { useCallback, useMemo } from 'react';
import type {
  AgentConfig,
  AgentDefinition,
  AgentRoutingConfig,
  CategoryConfig,
} from '../../types/agent-routing';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from '../../types/agent-routing';

/** Extract agent keys in UI display order. */
const AGENT_KEYS: readonly string[] = AGENT_DEFINITIONS.map(
  (a: AgentDefinition) => a.key,
);

/** Extract category keys in UI display order. */
const CATEGORY_KEYS: readonly string[] = CATEGORY_DEFINITIONS.map((c) => c.key);

/**
 * Sort all aliases: agent/category first (in UI definition order),
 * then custom aliases alphabetically.
 */
function sortAliases(aliases: AgentRoutingConfig): AgentRoutingConfig {
  const sorted: AgentRoutingConfig = {};

  // Agent aliases in definition order
  for (const key of AGENT_KEYS) {
    for (const [k, v] of Object.entries(aliases)) {
      if (k === key || k.startsWith(`${key}/`)) {
        sorted[k] = v;
      }
    }
  }

  // Category aliases in definition order
  for (const key of CATEGORY_KEYS) {
    for (const [k, v] of Object.entries(aliases)) {
      if (k === key || k.startsWith(`${key}/`)) {
        sorted[k] = v;
      }
    }
  }

  // Custom aliases alphabetically
  const custom = Object.entries(aliases).filter(([k]) => {
    if (AGENT_KEYS.includes(k)) return false;
    if (CATEGORY_KEYS.includes(k)) return false;
    if (k.includes('/')) return false;
    return true;
  });
  custom.sort((a, b) => a[0].localeCompare(b[0]));
  for (const [k, v] of custom) {
    sorted[k] = v;
  }

  return sorted;
}

const KNOWN_KEYS = new Set([
  ...AGENT_DEFINITIONS.map((a) => a.key),
  ...CATEGORY_DEFINITIONS.map((c) => c.key),
]);

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

export function useAgentRoutingDerived(
  aliases: AgentRoutingConfig,
  agentConfigs: Record<string, AgentConfig>,
  _categoryConfigs: Record<string, CategoryConfig>,
  resolvedAgentConfigs: Record<string, AgentConfig>,
  resolvedCategoryConfigs: Record<string, CategoryConfig>,
) {
  const customAliases = useMemo(() => {
    const knownPrefixes = [
      ...AGENT_DEFINITIONS.map((a) => `${a.key}/`),
      ...CATEGORY_DEFINITIONS.map((c) => `${c.key}/`),
    ];
    return Object.entries(sortAliases(aliases)).filter(([key]) => {
      if (KNOWN_KEYS.has(key)) return false;
      return !knownPrefixes.some((prefix) => key.startsWith(prefix));
    });
  }, [aliases]);

  const getAgentConfigInfo = useCallback(
    (key: string): ConfigInfo | null => {
      const config = resolvedAgentConfigs[key];
      if (!config) return null;

      return {
        model: config.model || 'Unassigned',
        description: config.description,
        color: agentConfigs[key]?.color,
        fallbackCount: config.fallback_models?.length || 0,
      };
    },
    [agentConfigs, resolvedAgentConfigs],
  );

  const getCategoryConfigInfo = useCallback(
    (key: string): ConfigInfo | null => {
      const config = resolvedCategoryConfigs[key];
      if (!config) return null;

      return {
        model: config.model || 'Unassigned',
        description: config.description,
        fallbackCount: config.fallback_models?.length || 0,
      };
    },
    [resolvedCategoryConfigs],
  );

  return {
    customAliases,
    getAgentConfigInfo,
    getCategoryConfigInfo,
  };
}
