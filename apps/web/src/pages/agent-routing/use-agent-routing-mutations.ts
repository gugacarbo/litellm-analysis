import { useMutation } from "@tanstack/react-query";
import {
  deleteAgentConfig,
  saveAllAgentConfigs,
  updateAgentConfig,
  updateGlobalFallbackModel,
} from "../../lib/api-client/agent-config";
import { updateAgentRoutingConfig } from "../../lib/api-client/agent-routing";
import type {
  AgentConfig,
  AgentRoutingConfig,
  CategoryConfig,
} from "@lite-llm/api-contracts/agent-routing";

export function useAgentRoutingMutations() {
  const updateAgentConfigMutation = useMutation({
    mutationFn: (params: {
      key: string;
      type: "agent" | "category";
      config: AgentConfig | CategoryConfig;
    }) => updateAgentConfig(params.key, params.type, params.config, true),
  });

  const deleteAgentConfigMutation = useMutation({
    mutationFn: (params: { key: string; type: "agent" | "category" }) =>
      deleteAgentConfig(params.key, params.type),
  });

  const saveAllConfigsMutation = useMutation({
    mutationFn: (params: {
      agents: Record<string, AgentConfig>;
      categories: Record<string, CategoryConfig>;
    }) => saveAllAgentConfigs(params.agents, params.categories),
  });

  const updateAgentRoutingMutation = useMutation({
    mutationFn: (modelGroupAlias: AgentRoutingConfig) =>
      updateAgentRoutingConfig(modelGroupAlias),
  });

  const updateGlobalFallbackMutation = useMutation({
    mutationFn: (model: string) => updateGlobalFallbackModel(model),
  });

  return {
    updateAgentConfigMutation,
    deleteAgentConfigMutation,
    saveAllConfigsMutation,
    updateAgentRoutingMutation,
    updateGlobalFallbackMutation,
  };
}
