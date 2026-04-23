import { useCallback, useMemo } from 'react';
import type {
  AgentConfig,
  AgentRoutingConfig,
  CategoryConfig,
} from '../../types/agent-routing';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from '../../types/agent-routing';

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
  const customAliases = useMemo(
    () => Object.entries(aliases).filter(([key]) => !KNOWN_KEYS.has(key)),
    [aliases],
  );

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
