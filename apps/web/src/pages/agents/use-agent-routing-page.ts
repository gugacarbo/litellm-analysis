import { useAgentRoutingActions } from "./use-agent-routing-actions";
import { useAgentRoutingDerived } from "./use-agent-routing-derived";
import { useAgentRoutingState } from "./use-agent-routing-state";

export function useAgentRoutingPageState() {
  const {
    agents,
    agentKeyByDisplayName,
    loading,
    error,
    categories,
    categoriesLoading,
  } = useAgentRoutingState();

  const {
    saving,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
  } = useAgentRoutingActions(agentKeyByDisplayName);

  const { getAgentSummary } = useAgentRoutingDerived(agents);

  return {
    loading,
    saving,
    error,
    agents,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
    getAgentSummary,
    categories,
    categoriesLoading,
  };
}
