export function addTool(
  tools: Record<string, boolean> | undefined,
  newToolKey: string,
  newToolValue: boolean,
  updateTools: (tools: Record<string, boolean>) => void,
): void {
  if (!newToolKey.trim()) return;
  updateTools({
    ...(tools || {}),
    [newToolKey.trim()]: newToolValue,
  });
}

export function removeTool(
  tools: Record<string, boolean> | undefined,
  key: string,
  updateTools: (tools: Record<string, boolean>) => void,
): void {
  const newTools = { ...(tools || {}) };
  delete newTools[key];
  updateTools(newTools);
}

export function updateToolValue(
  tools: Record<string, boolean> | undefined,
  key: string,
  value: boolean,
  updateTools: (tools: Record<string, boolean>) => void,
): void {
  updateTools({
    ...(tools || {}),
    [key]: value,
  });
}
