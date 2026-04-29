import type { AgentDefinition } from "@lite-llm/api-contracts/agent-routing";
import type { ConfigInfo } from "./agent-routing-types";
import { EntityFocusCard } from "./entity-focus-card";

export type AgentFocusViewProps = {
  loading: boolean;
  agents: AgentDefinition[];
  models: string[];
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  onOpenAgentConfig: (key: string) => void;
  onQuickModelChange: (agentKey: string, model: string) => void;
};

export function AgentFocusView({
  loading,
  agents,
  models,
  getAgentConfigInfo,
  onOpenAgentConfig,
  onQuickModelChange,
}: AgentFocusViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <EntityFocusCard
          key={agent.key}
          entityKey={agent.key}
          name={agent.name}
          description={agent.description}
          icon={agent.icon}
          configInfo={getAgentConfigInfo(agent.key)}
          models={models}
          onOpenConfig={onOpenAgentConfig}
          onQuickModelChange={onQuickModelChange}
        />
      ))}
    </div>
  );
}
