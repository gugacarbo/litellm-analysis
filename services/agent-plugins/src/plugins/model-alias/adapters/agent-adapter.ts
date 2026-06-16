import type { SystemAgent } from "../../../types";
import { modelAdapter } from "./model-adapter";

type AgentWithId = SystemAgent & { id: string };

export function agentAdapter(
  agent: AgentWithId,
  routingAgents: Record<string, string[]>,
  hasAgentRouting: boolean,
  enabledSet: Set<string>,
): { id: string; model: string } | null {
  if (hasAgentRouting && !routingAgents[agent.id]?.length) {
    return null;
  }

  const model = modelAdapter(agent.model, enabledSet);
  if (!model) {
    return null;
  }

  return { id: agent.id, model };
}
