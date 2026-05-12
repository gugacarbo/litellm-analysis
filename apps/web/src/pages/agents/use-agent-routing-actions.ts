import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  deleteSystemAgent,
  upsertSystemAgent,
} from "../../lib/api-client/agent-catalog";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingActions(
  agentKeyByDisplayName: Record<string, string>,
) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string>("");

  const upsertMutation = useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: SystemAgent }) =>
      upsertSystemAgent(id, agent),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSystemAgent(id),
  });

  const saving = upsertMutation.isPending || deleteMutation.isPending;

  const handleSaveAgent = useCallback(
    async (agent: SystemAgent) => {
      const catalogKey =
        agentKeyByDisplayName[agent.displayName] ?? agent.displayName;
      await upsertMutation.mutateAsync({
        id: catalogKey,
        agent,
      });
      setDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [queryClient, upsertMutation, agentKeyByDisplayName],
  );

  const handleDeleteAgent = useCallback(
    async (displayName: string) => {
      const catalogKey = agentKeyByDisplayName[displayName] ?? displayName;
      await deleteMutation.mutateAsync(catalogKey);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [deleteMutation, queryClient, agentKeyByDisplayName],
  );

  const openAgentEditor = useCallback((displayName: string) => {
    setEditingAgentId(displayName);
    setDialogOpen(true);
  }, []);

  return {
    saving,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
  };
}
