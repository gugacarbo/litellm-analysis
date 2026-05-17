import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import type { CategoryEntry } from "@lite-llm/api-contracts/category";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  deleteCategory,
  deleteSystemAgent,
  upsertCategory,
  upsertSystemAgent,
} from "../../lib/api-client/agent-catalog";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingActions(
  _agentKeyByDisplayName?: Record<string, string>,
) {
  const queryClient = useQueryClient();

  // Agent state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string>("");

  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(
    null,
  );

  const upsertMutation = useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: SystemAgent }) =>
      upsertSystemAgent(id, agent),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSystemAgent(id),
  });

  const categoryUpsertMutation = useMutation({
    mutationFn: ({ key, entry }: { key: string; entry: CategoryEntry }) =>
      upsertCategory(key, entry),
  });

  const categoryDeleteMutation = useMutation({
    mutationFn: (key: string) => deleteCategory(key),
  });

  const saving =
    upsertMutation.isPending ||
    deleteMutation.isPending ||
    categoryUpsertMutation.isPending ||
    categoryDeleteMutation.isPending;

  const handleSaveAgent = useCallback(
    async (agent: SystemAgent) => {
      const catalogKey = agent.id || agent.displayName;
      await upsertMutation.mutateAsync({
        id: catalogKey,
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
    async (agentId: string) => {
      await deleteMutation.mutateAsync(agentId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [deleteMutation, queryClient],
  );

  const openAgentEditor = useCallback((agentId: string) => {
    setEditingAgentId(agentId);
    setDialogOpen(true);
  }, []);

  // Category actions
  const handleSaveCategory = useCallback(
    async (key: string, entry: CategoryEntry) => {
      await categoryUpsertMutation.mutateAsync({ key, entry });
      setCategoryDialogOpen(false);
      setEditingCategoryKey(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categoryCatalog.all,
      });
    },
    [queryClient, categoryUpsertMutation],
  );

  const handleDeleteCategory = useCallback(
    async (key: string) => {
      await categoryDeleteMutation.mutateAsync(key);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categoryCatalog.all,
      });
    },
    [categoryDeleteMutation, queryClient],
  );

  const openCategoryEditor = useCallback((key: string | null) => {
    setEditingCategoryKey(key);
    setCategoryDialogOpen(true);
  }, []);

  return {
    saving,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
    // Category
    categoryDialogOpen,
    editingCategoryKey,
    setCategoryDialogOpen,
    handleSaveCategory,
    handleDeleteCategory,
    openCategoryEditor,
  };
}
