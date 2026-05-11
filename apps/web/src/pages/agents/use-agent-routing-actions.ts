import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  deleteSystemAgent,
  upsertSystemAgent,
} from "../../lib/api-client/agent-catalog";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingActions() {
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
      await upsertMutation.mutateAsync({
        id: agent.id!,
        agent,
      });
      setDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [queryClient, upsertMutation],
  );

  const handleDeleteAgent = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [deleteMutation, queryClient],
  );

  const openAgentEditor = useCallback((id: string) => {
    setEditingAgentId(id);
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
