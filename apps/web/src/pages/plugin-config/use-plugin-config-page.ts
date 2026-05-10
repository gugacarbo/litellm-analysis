import { useCallback, useState } from "react";
import {
  usePluginConfig,
  useSavePluginConfig,
  useToggleCategoryExport,
} from "@/hooks/use-plugin-config";

export function usePluginConfigPage(pluginId: string) {
  const { data, isPending: loading, error } = usePluginConfig(pluginId);
  const saveConfig = useSavePluginConfig(pluginId);
  const toggleCategory = useToggleCategoryExport(pluginId);

  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [agentMappings, setAgentMappings] = useState<Record<string, string>>(
    {},
  );
  const [categoryMappings, setCategoryMappings] = useState<
    Record<string, boolean>
  >({});

  const safeData = data ?? {
    config: {},
    agentMappings: {},
    categoryMappings: {},
    schema: [],
    internalAgents: [],
  };

  const handleConfigChange = useCallback((key: string, value: unknown) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAgentMappingChange = useCallback(
    (agentId: string, internalAgentId: string) => {
      setAgentMappings((prev) => ({ ...prev, [agentId]: internalAgentId }));
    },
    [],
  );

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      toggleCategory.mutate(categoryId);
      setCategoryMappings((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));
    },
    [toggleCategory],
  );

  const handleSave = useCallback(() => {
    saveConfig.mutate({
      config: { ...safeData.config, ...configValues },
      agentMappings: { ...safeData.agentMappings, ...agentMappings },
      categoryMappings: {
        ...safeData.categoryMappings,
        ...categoryMappings,
      },
    });
  }, [saveConfig, safeData, configValues, agentMappings, categoryMappings]);

  return {
    loading,
    error: error?.message ?? null,
    saving: saveConfig.isPending,
    configValues: { ...safeData.config, ...configValues },
    agentMappings: { ...safeData.agentMappings, ...agentMappings },
    categoryMappings: {
      ...safeData.categoryMappings,
      ...categoryMappings,
    },
    schema: safeData.schema,
    internalAgents: safeData.internalAgents,
    categories: Object.keys(safeData.categoryMappings),
    handleConfigChange,
    handleAgentMappingChange,
    handleCategoryToggle,
    handleSave,
  };
}
