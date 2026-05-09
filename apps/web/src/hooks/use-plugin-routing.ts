import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailablePlugins,
  toggleAgentPlugin,
} from "@/lib/api-client/plugin-routing";
import { queryKeys } from "@/lib/query-keys";

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
