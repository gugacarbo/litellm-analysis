import { Zap } from "lucide-react";
import { jsx as _jsx } from "react/jsx-runtime";
import { AgentFocusView } from "./agent-focus-view";
import { EntityRoutingCard } from "./entity-routing-card";
export function AgentRoutingAgentsTab({
  loading,
  agents,
  models,
  onOpenAgentConfig,
  onQuickModelChange,
  getAgentConfigInfo,
}) {
  const configuredAgentsCount = agents.filter((agent) => {
    const config = getAgentConfigInfo(agent.key);
    return Boolean(config && config.model !== "Unassigned");
  }).length;
  const totalFallbacks = agents.reduce((sum, agent) => {
    const config = getAgentConfigInfo(agent.key);
    return sum + (config?.fallbackCount ?? 0);
  }, 0);
  return _jsx(EntityRoutingCard, {
    icon: Zap,
    title: "Agent Routing",
    totalCount: agents.length,
    configuredCount: configuredAgentsCount,
    totalFallbacks: totalFallbacks,
    children: _jsx(AgentFocusView, {
      loading: loading,
      agents: agents,
      models: models,
      getAgentConfigInfo: getAgentConfigInfo,
      onOpenAgentConfig: onOpenAgentConfig,
      onQuickModelChange: onQuickModelChange,
    }),
  });
}
