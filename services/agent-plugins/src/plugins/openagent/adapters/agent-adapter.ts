import type { SystemAgent } from "../../../types";
import { modelAdapter } from "./model-adapter";

export function agentAdapter(agent: SystemAgent): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  if (agent.description) entry.description = agent.description;
  if (agent.model) Object.assign(entry, modelAdapter(agent.model));
  if (agent.config?.mode) entry.mode = agent.config.mode;
  if (agent.config?.tools) entry.tools = agent.config.tools;
  if (agent.config?.color) entry.color = agent.config.color;
  return entry;
}
