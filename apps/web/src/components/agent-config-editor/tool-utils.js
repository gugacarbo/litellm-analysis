export function addTool(
  tools,
  newToolKey,
  newToolValue,
  updateConfig,
  setNewToolKey,
) {
  if (!newToolKey.trim()) return;
  updateConfig("tools", {
    ...(tools || {}),
    [newToolKey.trim()]: newToolValue,
  });
  setNewToolKey("");
}
export function removeTool(tools, key, updateConfig) {
  const newTools = { ...(tools || {}) };
  delete newTools[key];
  updateConfig("tools", newTools);
}
export function updateToolValue(tools, key, value, updateConfig) {
  updateConfig("tools", {
    ...(tools || {}),
    [key]: value,
  });
}
