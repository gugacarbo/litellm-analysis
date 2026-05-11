import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { Zap } from "lucide-react";
import { AgentFocusView } from "./agent-focus-view";
import { EntityRoutingCard } from "./entity-routing-card";

type AgentRoutingAgentsTabProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};

export function AgentRoutingAgentsTab({
  loading,
  agents,
  onOpenAgentConfig,
  onDeleteAgent,
}: AgentRoutingAgentsTabProps) {
  const safeAgents = agents ?? [];
  const configuredCount = safeAgents.filter(
    (a) => a.model !== "" && (a.versions?.length ?? 0) > 0,
  ).length;

  return (
    <EntityRoutingCard
      icon={Zap}
      title="Agents"
      totalCount={safeAgents.length}
      configuredCount={configuredCount}
    >
      <AgentFocusView
        loading={loading}
        agents={safeAgents}
        onOpenAgentConfig={onOpenAgentConfig}
        onDeleteAgent={onDeleteAgent}
      />
    </EntityRoutingCard>
  );
}
