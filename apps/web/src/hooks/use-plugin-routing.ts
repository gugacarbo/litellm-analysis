import type { PluginRoutingDTO } from "@lite-llm/api-contracts/agent-catalog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailablePlugins,
  getPluginRouting,
  toggleAgentPlugin,
  updatePluginRouting,
} from "@/lib/api-client/plugin-routing";
import { queryKeys } from "@/lib/query-keys";

export function usePluginRouting() {
  return useQuery({
    queryKey: queryKeys.pluginRouting.all,
    queryFn: getPluginRouting,
  });
}

export function useUpdatePluginRouting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: PluginRoutingDTO) => updatePluginRouting(config),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.plugins,
      });
    },
  });
}

export function useToggleAgentPlugin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pluginId,
      agentId,
    }: {
      pluginId: string;
      agentId: string;
    }) => toggleAgentPlugin(pluginId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.all,
      });
    },
  });
}

export function useAvailablePlugins() {
  return useQuery({
    queryKey: queryKeys.pluginRouting.plugins,
    queryFn: getAvailablePlugins,
  });
}
