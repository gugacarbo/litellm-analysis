import type { PluginInfo } from "@lite-llm/api-contracts/agent-catalog";
import { useCallback } from "react";
import {
  useAvailablePlugins,
  useToggleAgentPlugin,
} from "@/hooks/use-plugin-routing";

export function usePluginRoutingPage(): {
  plugins: PluginInfo[];
  loading: boolean;
  error: string | null;
  handleTogglePlugin: (pluginId: string) => void;
  handleToggleAgent: (pluginId: string, agentId: string) => void;
  enabledPluginCount: number;
  totalAgentAssignments: number;
} {
  const {
    data: plugins = [],
    isPending: loading,
    error: queryError,
  } = useAvailablePlugins();
  const toggleAgent = useToggleAgentPlugin();

  const handleTogglePlugin = useCallback((_pluginId: string) => {
    console.warn("Plugin toggle not yet implemented via API");
  }, []);

  const handleToggleAgent = useCallback(
    (pluginId: string, agentId: string) => {
      toggleAgent.mutate({ pluginId, agentId });
    },
    [toggleAgent],
  );

  const enabledPluginCount = plugins.filter((p) => p.enabled).length;
  const totalAgentAssignments = plugins.reduce(
    (sum, p) => sum + p.enabledAgentCount,
    0,
  );

  const error = queryError?.message ?? null;

  return {
    plugins,
    loading,
    error,
    handleTogglePlugin,
    handleToggleAgent,
    enabledPluginCount,
    totalAgentAssignments,
  };
}
