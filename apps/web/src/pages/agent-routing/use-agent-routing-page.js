import { useMemo } from "react";
import { useAgentRoutingActions } from "./use-agent-routing-actions";
import { useAgentRoutingDerived } from "./use-agent-routing-derived";
import { useAgentRoutingState } from "./use-agent-routing-state";

function resolveModelName(model, aliases) {
  if (!model) return "";
  if (aliases[model]) {
    return aliases[model];
  }
  return model;
}
export function useAgentRoutingPageState() {
  const {
    aliases,
    setAliases,
    agentConfigs,
    setAgentConfigs,
    categoryConfigs,
    setCategoryConfigs,
    globalFallbackModel,
    setGlobalFallbackModel,
    loading,
    error,
    models,
    agents,
    categories,
  } = useAgentRoutingState();
  const resolvedAgentConfigs = useMemo(() => {
    const result = {};
    for (const [key, config] of Object.entries(agentConfigs)) {
      result[key] = {
        ...config,
        model: resolveModelName(config.model, aliases),
        fallback_models: (config.fallback_models || []).map((m) =>
          resolveModelName(m, aliases),
        ),
      };
    }
    return result;
  }, [agentConfigs, aliases]);
  const resolvedCategoryConfigs = useMemo(() => {
    const result = {};
    for (const [key, config] of Object.entries(categoryConfigs)) {
      result[key] = {
        ...config,
        model: resolveModelName(config.model, aliases),
        fallback_models: (config.fallback_models || []).map((m) =>
          resolveModelName(m, aliases),
        ),
      };
    }
    return result;
  }, [categoryConfigs, aliases]);
  const {
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
    handleDeleteAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteCategoryConfig,
    handleSaveAll,
    handleSaveGlobalFallback,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
    handleAliasSave,
    handleAliasDelete,
  } = useAgentRoutingActions(
    aliases,
    setAliases,
    agentConfigs,
    setAgentConfigs,
    categoryConfigs,
    setCategoryConfigs,
    globalFallbackModel,
    setGlobalFallbackModel,
  );
  const { customAliases, getAgentConfigInfo, getCategoryConfigInfo } =
    useAgentRoutingDerived(
      aliases,
      agents,
      categories,
      agentConfigs,
      categoryConfigs,
      resolvedAgentConfigs,
      resolvedCategoryConfigs,
    );
  return {
    loading,
    saving,
    error,
    customAliases,
    aliasDialogOpen,
    aliasDialogMode,
    aliasDialogKey,
    aliasDialogValue,
    agentConfigDialogOpen,
    categoryConfigDialogOpen,
    editingAgentKey,
    editingCategoryKey,
    resolvedAgentConfigs,
    resolvedCategoryConfigs,
    globalFallbackModel,
    models,
    agents,
    categories,
    setAliasDialogOpen,
    setAliasDialogKey,
    setAliasDialogValue,
    setAgentConfigDialogOpen,
    setCategoryConfigDialogOpen,
    handleSaveAll,
    handleSaveAgentConfig,
    handleQuickModelChange,
    handleQuickCategoryModelChange,
    handleDeleteAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteCategoryConfig,
    handleSaveGlobalFallback,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
    handleAliasSave,
    handleAliasDelete,
    getAgentConfigInfo,
    getCategoryConfigInfo,
  };
}
