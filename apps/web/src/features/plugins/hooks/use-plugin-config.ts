import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPluginConfig,
  getPluginSchema,
  savePluginConfig,
  toggleCategoryExport,
} from "@/shared/lib/api-client/plugin-routing";
import { queryKeys } from "@/shared/lib/query-keys";

export function usePluginConfig(pluginId: string) {
  return useQuery({
    queryKey: queryKeys.pluginRouting.pluginConfig(pluginId),
    queryFn: () => getPluginConfig(pluginId),
    enabled: !!pluginId,
  });
}

export function useSavePluginConfig(pluginId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      config?: Record<string, unknown>;
      agentMappings?: Record<string, string>;
      categoryMappings?: Record<string, boolean>;
    }) => savePluginConfig(pluginId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.pluginConfig(pluginId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.plugins,
      });
    },
  });
}

export function useToggleCategoryExport(pluginId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      toggleCategoryExport(pluginId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.pluginConfig(pluginId),
      });
    },
  });
}

export function usePluginSchema(pluginId: string) {
  return useQuery({
    queryKey: queryKeys.pluginRouting.pluginSchema(pluginId),
    queryFn: () => getPluginSchema(pluginId),
    enabled: !!pluginId,
  });
}
