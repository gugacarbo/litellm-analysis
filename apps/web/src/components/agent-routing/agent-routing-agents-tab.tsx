import type { AgentDefinition } from "@lite-llm/api-contracts/agent-routing";
import { Zap } from "lucide-react";
import { AgentFocusView } from "./agent-focus-view";
import type { ConfigInfo } from "./agent-routing-types";
import { EntityRoutingCard } from "./entity-routing-card";

export type AgentRoutingAgentsTabProps = {
  loading: boolean;
  agents: AgentDefinition[];
  models: string[];
  onOpenAgentConfig: (key: string) => void;
  onQuickModelChange: (agentKey: string, model: string) => void;
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingAgentsTab({
  loading,
  agents,
  models,
  onOpenAgentConfig,
  onQuickModelChange,
  getAgentConfigInfo,
}: AgentRoutingAgentsTabProps) {
  const configuredAgentsCount = agents.filter((agent) => {
    const config = getAgentConfigInfo(agent.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;

  const totalFallbacks = agents.reduce((sum, agent) => {
    const config = getAgentConfigInfo(agent.key);
    return sum + (config?.fallbackCount ?? 0);
  }, 0);

  return (
    <EntityRoutingCard
      icon={Zap}
      title="Agent Routing"
      totalCount={agents.length}
      configuredCount={configuredAgentsCount}
      totalFallbacks={totalFallbacks}
    >
      <AgentFocusView
        loading={loading}
        agents={agents}
        models={models}
        getAgentConfigInfo={getAgentConfigInfo}
        onOpenAgentConfig={onOpenAgentConfig}
        onQuickModelChange={onQuickModelChange}
      />
    </EntityRoutingCard>
  );
}
