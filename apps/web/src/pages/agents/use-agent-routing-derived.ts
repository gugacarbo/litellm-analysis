import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useCallback, useMemo } from "react";

export interface AgentSummaryInfo {
  id: string;
  displayName: string;
  icon: string;
  description: string;
  model: string;
  versionCount: number;
  pluginCount: number;
  mode: string;
}

export function useAgentRoutingDerived(agents: SystemAgent[]) {
  const agentsList = useMemo(() => agents, [agents]);

  const getAgentSummary = useCallback(
    (id: string): AgentSummaryInfo | null => {
      const agent = agentsList.find((a) => a.id === id);
      if (!agent) return null;

      return {
        id: agent.id,
        displayName: agent.displayName,
        icon: agent.icon,
        description: agent.description,
        model: agent.model || "Unassigned",
        versionCount: agent.versions.length,
        pluginCount: agent.enabledPlugins.length,
        mode: agent.config.mode ?? "subagent",
      };
    },
    [agentsList],
  );

  return { agentsList, getAgentSummary };
}
