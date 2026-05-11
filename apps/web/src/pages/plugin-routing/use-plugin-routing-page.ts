import type { PluginInfo } from "@lite-llm/api-contracts/agent-catalog";
import { useCallback } from "react";
import {
  useAvailablePlugins,
  useTogglePlugin,
} from "@/hooks/use-plugin-routing";

export function usePluginRoutingPage(): {
  plugins: PluginInfo[];
  loading: boolean;
  error: string | null;
  handleTogglePlugin: (pluginId: string) => void;
  enabledPluginCount: number;
} {
  const {
    data: plugins = [],
    isPending: loading,
    error: queryError,
  } = useAvailablePlugins();
  const togglePlugin = useTogglePlugin();

  const handleTogglePlugin = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId);
      if (plugin) {
        togglePlugin.mutate({ pluginId, enabled: !plugin.enabled });
      }
    },
    [plugins, togglePlugin],
  );

  const enabledPluginCount = plugins.filter((p) => p.enabled).length;
  const error = queryError?.message ?? null;

  return {
    plugins,
    loading,
    error,
    handleTogglePlugin,
    enabledPluginCount,
  };
}
