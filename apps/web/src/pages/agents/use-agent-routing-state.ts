import type {
  AgentConfig,
  AgentDefinition,
  AgentRoutingConfig,
  CategoryConfig,
  CategoryDefinition,
} from "@lite-llm/api-contracts/agent-routing";
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from "@lite-llm/api-contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getAgentConfig,
  getAgentDefinitions,
  getAgentRoutingConfig,
  getAllModels,
  getGlobalFallbackModel,
  getSyncAliasesConfig,
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
  const [syncAliases, setSyncAliases] = useState<boolean>(false);

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

  const agentDefinitionsQuery = useQuery({
    queryKey: queryKeys.agentDefinitions,
    queryFn: getAgentDefinitions,
  });

  const syncAliasesQuery = useQuery({
    queryKey: queryKeys.syncAliases,
    queryFn: getSyncAliasesConfig,
  });

  const agents: AgentDefinition[] =
    agentDefinitionsQuery.data?.agents ?? AGENT_DEFINITIONS;
  const categories: CategoryDefinition[] =
    agentDefinitionsQuery.data?.categories ?? CATEGORY_DEFINITIONS;

  const hasBlockingLoading =
    (agentRoutingQuery.isPending && !agentRoutingQuery.data) ||
    (agentDefinitionsQuery.isPending && !agentDefinitionsQuery.data);
  const firstError =
    agentRoutingQuery.error instanceof Error
      ? agentRoutingQuery.error
      : agentDefinitionsQuery.error instanceof Error
        ? agentDefinitionsQuery.error
        : null;

  useEffect(() => {
    if (!agentRoutingQuery.data) return;

    setAliases(agentRoutingQuery.data.aliases);
    setAgentConfigs(agentRoutingQuery.data.agentConfigs);
    setCategoryConfigs(agentRoutingQuery.data.categoryConfigs);
    setGlobalFallbackModel(agentRoutingQuery.data.globalFallbackModel);
  }, [agentRoutingQuery.data]);

  useEffect(() => {
    if (syncAliasesQuery.data !== undefined) {
      setSyncAliases(syncAliasesQuery.data.enabled);
    }
  }, [syncAliasesQuery.data]);

  return {
    aliases,
    setAliases,
    agentConfigs,
    setAgentConfigs,
    categoryConfigs,
    setCategoryConfigs,
    globalFallbackModel,
    setGlobalFallbackModel,
    syncAliases,
    setSyncAliases,
    loading: hasBlockingLoading,
    error: firstError?.message ?? null,
    models: modelsQuery.data?.map((m) => m.modelName) || [],
    agents,
    categories,
  };
}
