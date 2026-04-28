import type { AgentConfig } from "../../types/agent-routing";

type UpdateConfig = <K extends keyof AgentConfig>(
  field: K,
  value: AgentConfig[K],
) => void;

export function addTool(
  tools: Record<string, boolean> | undefined,
  newToolKey: string,
  newToolValue: boolean,
  updateConfig: UpdateConfig,
  setNewToolKey: (value: string) => void,
): void {
  if (!newToolKey.trim()) return;
  updateConfig("tools", {
    ...(tools || {}),
    [newToolKey.trim()]: newToolValue,
  });
  setNewToolKey("");
}

export function removeTool(
  tools: Record<string, boolean> | undefined,
  key: string,
  updateConfig: UpdateConfig,
): void {
  const newTools = { ...(tools || {}) };
  delete newTools[key];
  updateConfig("tools", newTools);
}

export function updateToolValue(
  tools: Record<string, boolean> | undefined,
  key: string,
  value: boolean,
  updateConfig: UpdateConfig,
): void {
  updateConfig("tools", {
    ...(tools || {}),
    [key]: value,
  });
}
