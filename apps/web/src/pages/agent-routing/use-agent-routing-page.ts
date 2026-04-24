import { useMemo } from 'react';
import type { AgentConfig, CategoryConfig } from '../../types/agent-routing';
import { useAgentRoutingActions } from './use-agent-routing-actions';
import { useAgentRoutingDerived } from './use-agent-routing-derived';
import { useAgentRoutingState } from './use-agent-routing-state';

function resolveModelName(
  model: string | undefined,
  aliases: Record<string, string>,
): string {
  if (!model) return '';
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
    loading,
    error,
  } = useAgentRoutingState();

  const resolvedAgentConfigs = useMemo<Record<string, AgentConfig>>(() => {
    const result: Record<string, AgentConfig> = {};
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

  const resolvedCategoryConfigs = useMemo<
    Record<string, CategoryConfig>
  >(() => {
    const result: Record<string, CategoryConfig> = {};
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
    handleDeleteAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteCategoryConfig,
    handleSaveAll,
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
  );

  const { customAliases, getAgentConfigInfo, getCategoryConfigInfo } =
    useAgentRoutingDerived(
      aliases,
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
    setAliasDialogOpen,
    setAliasDialogKey,
    setAliasDialogValue,
    setAgentConfigDialogOpen,
    setCategoryConfigDialogOpen,
    handleSaveAll,
    handleSaveAgentConfig,
    handleDeleteAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteCategoryConfig,
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
