import type { PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";

export function agentAdapter(
  agent: SystemAgent,
  enabledAgents: Record<string, string[]>,
  configDefaultModel: string,
  context: PluginRuntimeContext,
): { role: string; displayName: string; primaryModelId: string } | null {
  const role = Object.entries(enabledAgents).find(([, agentIds]) =>
    agentIds.includes(agent.id ?? ""),
  )?.[0];
  if (!role) return null;

  const primaryModelId: string =
    agent.model || configDefaultModel || agent.id || "";
  const displayName =
    agent.displayName ||
    (primaryModelId ? context.allModels[primaryModelId]?.displayName : "") ||
    role;

  return { role, displayName, primaryModelId };
}
