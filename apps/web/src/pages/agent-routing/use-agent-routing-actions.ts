import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  deleteAgentConfig,
  saveAllAgentConfigs,
  updateAgentConfig,
  updateAgentRoutingConfig,
  updateGlobalFallbackModel,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";
import type {
  AgentConfig,
  AgentRoutingConfig,
  CategoryConfig,
} from "../../types/agent-routing";
import { useAgentRoutingAliasActions } from "./use-agent-routing-alias-actions";
import { useAgentRoutingDialogState } from "./use-agent-routing-dialog-state";

type SetAliases = (
  aliases:
    | AgentRoutingConfig
    | ((prev: AgentRoutingConfig) => AgentRoutingConfig),
) => void;
type SetAgentConfigs = (
  configs:
    | Record<string, AgentConfig>
    | ((prev: Record<string, AgentConfig>) => Record<string, AgentConfig>),
) => void;
type SetCategoryConfigs = (
  configs:
    | Record<string, CategoryConfig>
    | ((
        prev: Record<string, CategoryConfig>,
      ) => Record<string, CategoryConfig>),
) => void;
type SetGlobalFallbackModel = (
  model: string | ((prev: string) => string),
) => void;

export function useAgentRoutingActions(
  _aliases: Record<string, string>,
  setAliases: SetAliases,
  agentConfigs: Record<string, AgentConfig>,
  setAgentConfigs: SetAgentConfigs,
  categoryConfigs: Record<string, CategoryConfig>,
  setCategoryConfigs: SetCategoryConfigs,
  _globalFallbackModel: string,
  setGlobalFallbackModel: SetGlobalFallbackModel,
) {
  const queryClient = useQueryClient();

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

  const {
    agentConfigDialogOpen,
    categoryConfigDialogOpen,
    editingAgentKey,
    editingCategoryKey,
    aliasDialogOpen,
    aliasDialogMode,
    aliasDialogKey,
    aliasDialogValue,
    setAgentConfigDialogOpen,
    setCategoryConfigDialogOpen,
    setAliasDialogOpen,
    setAliasDialogKey,
    setAliasDialogValue,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
  } = useAgentRoutingDialogState();

  const { handleAliasSave, handleAliasDelete } = useAgentRoutingAliasActions(
    updateAgentRoutingMutation,
    queryClient,
    setAliases,
    aliasDialogKey,
    aliasDialogValue,
    setAliasDialogOpen,
  );

  const saving =
    updateAgentConfigMutation.isPending ||
    deleteAgentConfigMutation.isPending ||
    saveAllConfigsMutation.isPending ||
    updateAgentRoutingMutation.isPending;

  const handleSaveAgentConfig = useCallback(
    async (config: AgentConfig) => {
      await updateAgentConfigMutation.mutateAsync({
        key: editingAgentKey,
        type: "agent",
        config,
      });

      setAgentConfigs((prev) => ({ ...prev, [editingAgentKey]: config }));
      setAgentConfigDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [
      editingAgentKey,
      queryClient,
      setAgentConfigs,
      setAgentConfigDialogOpen,
      updateAgentConfigMutation,
    ],
  );

  const handleSaveCategoryConfig = useCallback(
    async (config: CategoryConfig) => {
      await updateAgentConfigMutation.mutateAsync({
        key: editingCategoryKey,
        type: "category",
        config,
      });

      setCategoryConfigs((prev) => ({
        ...prev,
        [editingCategoryKey]: config,
      }));
      setCategoryConfigDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [
      editingCategoryKey,
      queryClient,
      setCategoryConfigs,
      setCategoryConfigDialogOpen,
      updateAgentConfigMutation,
    ],
  );

  const handleDeleteAgentConfig = useCallback(
    async (key: string) => {
      await deleteAgentConfigMutation.mutateAsync({ key, type: "agent" });

      setAgentConfigs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [deleteAgentConfigMutation, queryClient, setAgentConfigs],
  );

  const handleDeleteCategoryConfig = useCallback(
    async (key: string) => {
      await deleteAgentConfigMutation.mutateAsync({
        key,
        type: "category",
      });

      setCategoryConfigs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [deleteAgentConfigMutation, queryClient, setCategoryConfigs],
  );

  const handleSaveAll = useCallback(async () => {
    await saveAllConfigsMutation.mutateAsync({
      agents: agentConfigs,
      categories: categoryConfigs,
    });

    await queryClient.invalidateQueries({
      queryKey: queryKeys.agentRoutingData,
    });
  }, [agentConfigs, categoryConfigs, queryClient, saveAllConfigsMutation]);

  const handleSaveGlobalFallback = useCallback(
    async (model: string) => {
      await updateGlobalFallbackMutation.mutateAsync(model);
      setGlobalFallbackModel(model);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [queryClient, setGlobalFallbackModel, updateGlobalFallbackMutation],
  );

  return {
    saving,
    agentConfigDialogOpen,
    categoryConfigDialogOpen,
    editingAgentKey,
    editingCategoryKey,
    aliasDialogOpen,
    aliasDialogMode,
    aliasDialogKey,
    aliasDialogValue,
    setAgentConfigDialogOpen,
    setCategoryConfigDialogOpen,
    setAliasDialogOpen,
    setAliasDialogKey,
    setAliasDialogValue,
    handleSaveAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteAgentConfig,
    handleDeleteCategoryConfig,
    handleSaveAll,
    handleSaveGlobalFallback,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
    handleAliasSave,
    handleAliasDelete,
  };
}
