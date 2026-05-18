import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { Plus, Zap } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AgentFocusView } from "./agent-focus-view";
import { EntityRoutingCard } from "./entity-routing-card";

type AgentRoutingAgentsTabProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
  onAddAgent: () => void;
};

export function AgentRoutingAgentsTab({
  loading,
  agents,
  onOpenAgentConfig,
  onDeleteAgent,
  onAddAgent,
}: AgentRoutingAgentsTabProps) {
  const safeAgents = agents ?? [];
  const configuredCount = safeAgents.filter((a) => a.model !== "").length;

  return (
    <EntityRoutingCard
      icon={Zap}
      title="Agents"
      totalCount={safeAgents.length}
      configuredCount={configuredCount}
      headerAction={
        <Button size="sm" onClick={onAddAgent}>
          <Plus className="h-4 w-4 mr-1" />
          Add Agent
        </Button>
      }
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
