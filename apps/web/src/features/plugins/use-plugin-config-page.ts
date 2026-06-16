import type { AgentCatalogEntry } from "@lite-llm/contracts/agent-routing";
import type { CategoryEntry } from "@lite-llm/contracts/category";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SystemAgentOption } from "@/shared/lib/api-client/agent-catalog";
import {
  getAgentCatalog,
  getCategoryCatalog,
} from "@/shared/lib/api-client/agent-catalog";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  usePluginConfig,
  usePluginSchema,
  useSavePluginConfig,
  useToggleCategoryExport,
} from "./hooks/use-plugin-config";
import { useAvailablePlugins } from "./hooks/use-plugin-routing";

export function usePluginConfigPage(pluginId: string) {
  const { data, isPending: loading, error } = usePluginConfig(pluginId);
  const { data: plugins = [], isPending: pluginsLoading } =
    useAvailablePlugins();
  const { data: agentCatalog, isPending: agentsLoading } = useQuery({
    queryKey: queryKeys.agentCatalog.all,
    queryFn: getAgentCatalog,
  });
  const { data: categoryCatalog, isPending: categoriesLoading } = useQuery({
    queryKey: queryKeys.categoryCatalog.all,
    queryFn: getCategoryCatalog,
  });
  const { data: schemaData } = usePluginSchema(pluginId);
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

  useEffect(() => {
    setConfigValues({});
    setAgentMappings({});
    setCategoryMappings({});
    setIsDirty(false);
  }, []);

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

  const categoryOptions = useMemo(() => {
    const entries = categoryCatalog as
      | Record<string, CategoryEntry>
      | undefined;
    if (!entries) return [];
    return Object.entries(entries).map(([key, entry]) => ({
      value: key,
      label:
        entry.description ??
        key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [categoryCatalog]);

  const resolvedSchema = useMemo(() => {
    return safeData.schema.map((field) => {
      if (field.type !== "multiselect" && field.type !== "switch-group")
        return field;
      if (field.key === "selectedAgents") {
        return {
          ...field,
          options: systemAgents.map((a) => ({
            value: a.key,
            label: a.displayName,
          })),
        };
      }
      if (field.key === "selectedCategories") {
        return { ...field, options: categoryOptions };
      }
      return field;
    });
  }, [safeData.schema, systemAgents, categoryOptions]);

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
      setIsDirty(true);
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
    loading: loading || pluginsLoading || agentsLoading || categoriesLoading,
    error: error?.message ?? null,
    saving: saveConfig.isPending,
    notFound,
    pluginName,
    pluginId,
    configValues: { ...safeData.config, ...configValues },
    agentMappings: { ...safeData.agentMappings, ...agentMappings },
    categoryMappings: {
      ...safeData.categoryMappings,
      ...categoryMappings,
    },
    schema: resolvedSchema,
    internalAgents: safeData.internalAgents,
    systemAgents,
    categories: Object.keys(safeData.categoryMappings),
    categoryOptions,
    isDirty,
    handleConfigChange,
    handleAgentMappingChange,
    handleCategoryToggle,
    handleSave,
    jsonSchema: schemaData?.schema ?? null,
    allModels: (safeData as Record<string, unknown>).allModels as Record<
      string,
      unknown
    >,
    modelProxyProvider: (safeData as Record<string, unknown>).modelProxyProvider as {
      baseUrl: string;
      name: string;
    },
  };
}
