import type { AgentRoutingConfig } from "@lite-llm/api-contracts/agent-routing";
import { useCallback } from "react";
import { queryKeys } from "../../lib/query-keys";

type SetAliases = (
  aliases:
    | AgentRoutingConfig
    | ((prev: AgentRoutingConfig) => AgentRoutingConfig),
) => void;

export function useAgentRoutingAliasActions(
  updateAgentRoutingMutation: {
    mutateAsync: (config: AgentRoutingConfig) => Promise<unknown>;
  },
  queryClient: {
    invalidateQueries: (opts: {
      queryKey: readonly unknown[];
    }) => Promise<void>;
  },
  setAliases: SetAliases,
  aliasDialogKey: string,
  aliasDialogValue: string,
  setAliasDialogOpen: (open: boolean) => void,
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
    async (key: string) => {
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
