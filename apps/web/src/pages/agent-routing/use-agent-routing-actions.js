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
import { useAgentRoutingAliasActions } from "./use-agent-routing-alias-actions";
import { useAgentRoutingDialogState } from "./use-agent-routing-dialog-state";
export function useAgentRoutingActions(
  _aliases,
  setAliases,
  agentConfigs,
  setAgentConfigs,
  categoryConfigs,
  setCategoryConfigs,
  _globalFallbackModel,
  setGlobalFallbackModel,
) {
  const queryClient = useQueryClient();
  const updateAgentConfigMutation = useMutation({
    mutationFn: (params) =>
      updateAgentConfig(params.key, params.type, params.config, true),
  });
  const deleteAgentConfigMutation = useMutation({
    mutationFn: (params) => deleteAgentConfig(params.key, params.type),
  });
  const saveAllConfigsMutation = useMutation({
    mutationFn: (params) =>
      saveAllAgentConfigs(params.agents, params.categories),
  });
  const updateAgentRoutingMutation = useMutation({
    mutationFn: (modelGroupAlias) => updateAgentRoutingConfig(modelGroupAlias),
  });
  const updateGlobalFallbackMutation = useMutation({
    mutationFn: (model) => updateGlobalFallbackModel(model),
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
    async (config) => {
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
  const handleQuickModelChange = useCallback(
    async (agentKey, model) => {
      const currentConfig = agentConfigs[agentKey] || {};
      const newConfig = {
        ...currentConfig,
        model,
      };
      await updateAgentConfigMutation.mutateAsync({
        key: agentKey,
        type: "agent",
        config: newConfig,
      });
      setAgentConfigs((prev) => ({ ...prev, [agentKey]: newConfig }));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [agentConfigs, queryClient, setAgentConfigs, updateAgentConfigMutation],
  );
  const handleQuickCategoryModelChange = useCallback(
    async (categoryKey, model) => {
      const currentConfig = categoryConfigs[categoryKey] || {};
      const newConfig = {
        ...currentConfig,
        model,
      };
      await updateAgentConfigMutation.mutateAsync({
        key: categoryKey,
        type: "category",
        config: newConfig,
      });
      setCategoryConfigs((prev) => ({ ...prev, [categoryKey]: newConfig }));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [
      categoryConfigs,
      queryClient,
      setCategoryConfigs,
      updateAgentConfigMutation,
    ],
  );
  const handleSaveCategoryConfig = useCallback(
    async (config) => {
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
    async (key) => {
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
    async (key) => {
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
    async (model) => {
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
    handleQuickModelChange,
    handleQuickCategoryModelChange,
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
