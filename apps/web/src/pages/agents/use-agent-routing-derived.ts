import type {
  AgentConfig,
  AgentDefinition,
  AgentRoutingConfig,
  CategoryConfig,
  CategoryDefinition,
} from "@lite-llm/api-contracts/agent-routing";
import { useCallback, useMemo } from "react";

/**
 * Sort all aliases: agent/category first (in UI definition order),
 * then custom aliases alphabetically.
 */
function sortAliases(
  aliases: AgentRoutingConfig,
  agentKeys: readonly string[],
  categoryKeys: readonly string[],
): AgentRoutingConfig {
  const sorted: AgentRoutingConfig = {};

  // Agent aliases in definition order
  for (const key of agentKeys) {
    for (const [k, v] of Object.entries(aliases)) {
      if (k === key || k.startsWith(`${key}/`)) {
        sorted[k] = v;
      }
    }
  }

  // Category aliases in definition order
  for (const key of categoryKeys) {
    for (const [k, v] of Object.entries(aliases)) {
      if (k === key || k.startsWith(`${key}/`)) {
        sorted[k] = v;
      }
    }
  }

  // Custom aliases alphabetically
  const custom = Object.entries(aliases).filter(([k]) => {
    if (agentKeys.includes(k)) return false;
    if (categoryKeys.includes(k)) return false;
    if (k.includes("/")) return false;
    return true;
  });
  custom.sort((a, b) => a[0].localeCompare(b[0]));
  for (const [k, v] of custom) {
    sorted[k] = v;
  }

  return sorted;
}

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

export function useAgentRoutingDerived(
  aliases: AgentRoutingConfig,
  agents: AgentDefinition[],
  categories: CategoryDefinition[],
  agentConfigs: Record<string, AgentConfig>,
  _categoryConfigs: Record<string, CategoryConfig>,
  resolvedAgentConfigs: Record<string, AgentConfig>,
  resolvedCategoryConfigs: Record<string, CategoryConfig>,
) {
  const agentKeys = useMemo(() => agents.map((agent) => agent.key), [agents]);
  const categoryKeys = useMemo(
    () => categories.map((category) => category.key),
    [categories],
  );
  const knownKeys = useMemo(
    () => new Set([...agentKeys, ...categoryKeys]),
    [agentKeys, categoryKeys],
  );

  const customAliases = useMemo(() => {
    const knownPrefixes = [
      ...agentKeys.map((key) => `${key}/`),
      ...categoryKeys.map((key) => `${key}/`),
    ];
    return Object.entries(sortAliases(aliases, agentKeys, categoryKeys)).filter(
      ([key]) => {
        if (knownKeys.has(key)) return false;
        return !knownPrefixes.some((prefix) => key.startsWith(prefix));
      },
    );
  }, [agentKeys, aliases, categoryKeys, knownKeys]);

  const getAgentConfigInfo = useCallback(
    (key: string): ConfigInfo | null => {
      const config = resolvedAgentConfigs[key];
      if (!config) return null;

      return {
        model: config.model || "Unassigned",
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
        model: config.model || "Unassigned",
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
