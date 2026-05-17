import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailablePlugins,
  getPluginRouting,
  savePluginRouting,
} from "@/lib/api-client/plugin-routing";
import { queryKeys } from "@/lib/query-keys";

export function useAvailablePlugins() {
  return useQuery({
    queryKey: queryKeys.pluginRouting.plugins,
    queryFn: getAvailablePlugins,
  });
}

export function useTogglePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pluginId,
      enabled,
    }: {
      pluginId: string;
      enabled: boolean;
    }) => {
      const config = await getPluginRouting();
      if (!config[pluginId]) {
        config[pluginId] = {
          enabled: true,
          outputFile: "",
          routing: { agents: {}, categories: {} },
        };
      }
      config[pluginId].enabled = enabled;
      return savePluginRouting(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.all,
      });
    },
  });
}

export function useSavePlugins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const config = await getPluginRouting();
      return savePluginRouting(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.all,
      });
    },
  });
}
