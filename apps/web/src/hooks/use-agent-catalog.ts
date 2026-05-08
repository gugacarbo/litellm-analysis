import type { SystemAgentDTO } from "@lite-llm/api-contracts/agent-catalog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateSystemAgentDTO } from "@/lib/api-client/agent-catalog";
import {
  createAgentCatalogItem,
  deleteAgentCatalogItem,
  getAgentCatalog,
  getAgentCatalogItem,
  updateAgentCatalogItem,
} from "@/lib/api-client/agent-catalog";
import { queryKeys } from "@/lib/query-keys";

export function useAgentCatalog() {
  return useQuery({
    queryKey: queryKeys.agentCatalog.all,
    queryFn: getAgentCatalog,
  });
}

export function useAgentCatalogItem(id: string) {
  return useQuery({
    queryKey: queryKeys.agentCatalog.detail(id),
    queryFn: () => getAgentCatalogItem(id),
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSystemAgentDTO) => createAgentCatalogItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agentCatalog.all });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: Partial<SystemAgentDTO> }) =>
      updateAgentCatalogItem(params.id, params.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agentCatalog.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.detail(variables.id),
      });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAgentCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agentCatalog.all });
    },
  });
}
