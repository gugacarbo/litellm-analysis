import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getAgentConfig, getAgentRoutingConfig } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';
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

  const agentRoutingQuery = useQuery({
    queryKey: queryKeys.agentRoutingData,
    queryFn: async () => {
      const [routingConfig, configData] = await Promise.all([
        getAgentRoutingConfig(),
        getAgentConfig(),
      ]);

      return {
        aliases: routingConfig,
        agentConfigs: configData.agents || {},
        categoryConfigs: configData.categories || {},
      };
    },
  });

  useEffect(() => {
    if (!agentRoutingQuery.data) return;

    setAliases(agentRoutingQuery.data.aliases);
    setAgentConfigs(agentRoutingQuery.data.agentConfigs);
    setCategoryConfigs(agentRoutingQuery.data.categoryConfigs);
  }, [agentRoutingQuery.data]);

  return {
    aliases,
    setAliases,
    agentConfigs,
    setAgentConfigs,
    categoryConfigs,
    setCategoryConfigs,
    loading: agentRoutingQuery.isPending && !agentRoutingQuery.data,
    error:
      agentRoutingQuery.error instanceof Error
        ? agentRoutingQuery.error.message
        : null,
  };
}
