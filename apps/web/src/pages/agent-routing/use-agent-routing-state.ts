import { useEffect, useState } from 'react';
import { getAgentConfig, getAgentRoutingConfig } from '../../lib/api-client';
import type {
  AgentConfig,
  AgentRoutingConfig,
  CategoryConfig,
} from '../../types/agent-routing';

export function useAgentRoutingState() {
  const [aliases, setAliases] = useState<AgentRoutingConfig>({});
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfig>>(
    {},
  );
  const [categoryConfigs, setCategoryConfigs] = useState<
    Record<string, CategoryConfig>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [routingConfig, configData] = await Promise.all([
          getAgentRoutingConfig(),
          getAgentConfig(),
        ]);
        setAliases(routingConfig);
        setAgentConfigs(configData.agents || {});
        setCategoryConfigs(configData.categories || {});
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return {
    aliases,
    setAliases,
    agentConfigs,
    setAgentConfigs,
    categoryConfigs,
    setCategoryConfigs,
    loading,
    error,
  };
}
