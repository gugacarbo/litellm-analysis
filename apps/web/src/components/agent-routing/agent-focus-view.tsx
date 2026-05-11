import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { EntityFocusCard } from "./entity-focus-card";

type AgentFocusViewProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};

export function AgentFocusView({
  loading,
  agents,
  onOpenAgentConfig,
  onDeleteAgent,
}: AgentFocusViewProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <EntityFocusCard
          key={agent.id}
          agent={agent}
          onOpenConfig={onOpenAgentConfig}
          onDelete={onDeleteAgent}
        />
      ))}
    </div>
  );
}
