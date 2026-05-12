import type { AgentCatalogEntry } from "@lite-llm/api-contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  usePluginConfig,
  useSavePluginConfig,
  useToggleCategoryExport,
} from "@/hooks/use-plugin-config";
import { useAvailablePlugins } from "@/hooks/use-plugin-routing";
import { getAgentCatalog } from "@/lib/api-client/agent-catalog";
import { queryKeys } from "@/lib/query-keys";

export interface SystemAgentOption {
  key: string;
  displayName: string;
}

export function usePluginConfigPage(pluginId: string) {
  const { data, isPending: loading, error } = usePluginConfig(pluginId);
  const { data: plugins = [], isPending: pluginsLoading } =
    useAvailablePlugins();
  const { data: agentCatalog, isPending: agentsLoading } = useQuery({
    queryKey: queryKeys.agentCatalog.all,
    queryFn: getAgentCatalog,
  });
  const saveConfig = useSavePluginConfig(pluginId);
  const toggleCategory = useToggleCategoryExport(pluginId);

  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [agentMappings, setAgentMappings] = useState<Record<string, string>>(
    {},
  );
  const [categoryMappings, setCategoryMappings] = useState<
    Record<string, boolean>
  >({});
  const [isDirty, setIsDirty] = useState(false);

  // Reset local edit state when server data changes
  // (after save or external update)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — trigger reset on data refetch
  useEffect(() => {
    setConfigValues({});
    setAgentMappings({});
    setCategoryMappings({});
    setIsDirty(false);
  }, [data]);

  const safeData = data ?? {
    config: {},
    agentMappings: {},
    categoryMappings: {},
    schema: [],
    internalAgents: [],
  };

  const systemAgents: SystemAgentOption[] = useMemo(() => {
    const agents = agentCatalog?.agents as AgentCatalogEntry[] | undefined;
    if (!agents) return [];
    return agents.map((a) => ({ key: a.key, displayName: a.displayName }));
  }, [agentCatalog]);

  // Plugin exists if it's in the available plugins registry
  const notFound =
    !pluginsLoading &&
    pluginId !== "" &&
    plugins.length > 0 &&
    !plugins.some((p) => p.id === pluginId);

  const pluginName = plugins.find((p) => p.id === pluginId)?.name;

  const handleConfigChange = useCallback((key: string, value: unknown) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const handleAgentMappingChange = useCallback(
    (internalAgentId: string, systemAgentKey: string) => {
      setAgentMappings((prev) => {
        if (systemAgentKey === "") {
          const { [internalAgentId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [internalAgentId]: systemAgentKey };
      });
      setIsDirty(true);
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
    saveConfig.mutate(
      {
        config: { ...safeData.config, ...configValues },
        agentMappings: { ...safeData.agentMappings, ...agentMappings },
        categoryMappings: {
          ...safeData.categoryMappings,
          ...categoryMappings,
        },
      },
      {
        onSuccess: () => toast.success("Configuration saved"),
        onError: () => toast.error("Failed to save configuration"),
      },
    );
  }, [saveConfig, safeData, configValues, agentMappings, categoryMappings]);

  return {
    loading: loading || pluginsLoading || agentsLoading,
    error: error?.message ?? null,
    saving: saveConfig.isPending,
    notFound,
    pluginName,
    configValues: { ...safeData.config, ...configValues },
    agentMappings: { ...safeData.agentMappings, ...agentMappings },
    categoryMappings: {
      ...safeData.categoryMappings,
      ...categoryMappings,
    },
    schema: safeData.schema,
    internalAgents: safeData.internalAgents,
    systemAgents,
    categories: Object.keys(safeData.categoryMappings),
    isDirty,
    handleConfigChange,
    handleAgentMappingChange,
    handleCategoryToggle,
    handleSave,
  };
}
