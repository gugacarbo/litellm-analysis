import type { PluginInfo } from "@lite-llm/api-contracts/agent-catalog";
import { useCallback } from "react";
import {
  useAvailablePlugins,
  useSavePlugins,
  useTogglePlugin,
} from "@/hooks/use-plugin-routing";

export function usePluginRoutingPage(): {
  plugins: PluginInfo[];
  loading: boolean;
  error: string | null;
  handleTogglePlugin: (pluginId: string) => void;
  handleSave: () => void;
  saving: boolean;
  enabledPluginCount: number;
} {
  const {
    data: plugins = [],
    isPending: loading,
    error: queryError,
  } = useAvailablePlugins();
  const togglePlugin = useTogglePlugin();
  const savePlugins = useSavePlugins();

  const handleTogglePlugin = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId);
      if (plugin) {
        togglePlugin.mutate({ pluginId, enabled: !plugin.enabled });
      }
    },
    [plugins, togglePlugin],
  );

  const handleSave = useCallback(() => {
    savePlugins.mutate();
  }, [savePlugins]);

  const enabledPluginCount = plugins.filter((p) => p.enabled).length;
  const error = queryError?.message ?? null;
  const saving = savePlugins.isPending;

  return {
    plugins,
    loading,
    error,
    handleTogglePlugin,
    handleSave,
    saving,
    enabledPluginCount,
  };
}
