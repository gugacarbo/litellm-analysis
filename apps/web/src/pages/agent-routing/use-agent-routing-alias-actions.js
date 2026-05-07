import { useCallback } from "react";
import { queryKeys } from "../../lib/query-keys";
export function useAgentRoutingAliasActions(
  updateAgentRoutingMutation,
  queryClient,
  setAliases,
  aliasDialogKey,
  aliasDialogValue,
  setAliasDialogOpen,
) {
  const handleAliasSave = useCallback(async () => {
    const key = aliasDialogKey.trim();
    const value = aliasDialogValue.trim();
    if (!key || !value) return;
    await updateAgentRoutingMutation.mutateAsync({ [key]: value });
    setAliases((prev) => ({ ...prev, [key]: value }));
    setAliasDialogOpen(false);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.agentRoutingData,
    });
  }, [
    aliasDialogKey,
    aliasDialogValue,
    queryClient,
    setAliases,
    updateAgentRoutingMutation,
    setAliasDialogOpen,
  ]);
  const handleAliasDelete = useCallback(
    async (key) => {
      await updateAgentRoutingMutation.mutateAsync({ [key]: "" });
      setAliases((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    },
    [queryClient, setAliases, updateAgentRoutingMutation],
  );
  return {
    handleAliasSave,
    handleAliasDelete,
  };
}
