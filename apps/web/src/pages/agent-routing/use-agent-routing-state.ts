import type {
  AgentConfig,
  AgentRoutingConfig,
  CategoryConfig,
} from "@lite-llm/api-contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getAgentConfig,
  getAgentRoutingConfig,
  getAllModels,
  getGlobalFallbackModel,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingState() {
  const [aliases, setAliases] = useState<AgentRoutingConfig>({});
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfig>>(
    {},
  );
  const [categoryConfigs, setCategoryConfigs] = useState<
    Record<string, CategoryConfig>
  >({});
  const [globalFallbackModel, setGlobalFallbackModel] =
    useState<string>("gpt-5.1");

  const agentRoutingQuery = useQuery({
    queryKey: queryKeys.agentRoutingData,
    queryFn: async () => {
      const [routingConfig, configData, globalFallback] = await Promise.all([
        getAgentRoutingConfig(),
        getAgentConfig(),
        getGlobalFallbackModel(),
      ]);

      return {
        aliases: routingConfig,
        agentConfigs: configData.agents || {},
        categoryConfigs: configData.categories || {},
        globalFallbackModel: globalFallback.globalFallbackModel,
      };
    },
  });

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: () => getAllModels(),
  });

  useEffect(() => {
    if (!agentRoutingQuery.data) return;

    setAliases(agentRoutingQuery.data.aliases);
    setAgentConfigs(agentRoutingQuery.data.agentConfigs);
    setCategoryConfigs(agentRoutingQuery.data.categoryConfigs);
    setGlobalFallbackModel(agentRoutingQuery.data.globalFallbackModel);
  }, [agentRoutingQuery.data]);

  return {
    aliases,
    setAliases,
    agentConfigs,
    setAgentConfigs,
    categoryConfigs,
    setCategoryConfigs,
    globalFallbackModel,
    setGlobalFallbackModel,
    loading: agentRoutingQuery.isPending && !agentRoutingQuery.data,
    error:
      agentRoutingQuery.error instanceof Error
        ? agentRoutingQuery.error.message
        : null,
    models: modelsQuery.data?.map((m) => m.modelName) || [],
  };
}
