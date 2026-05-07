export function addTool(tools, newToolKey, newToolValue, updateTools) {
  if (!newToolKey.trim()) return;
  updateTools({
    ...(tools || {}),
    [newToolKey.trim()]: newToolValue,
  });
}
export function removeTool(tools, key, updateTools) {
  const newTools = { ...(tools || {}) };
  delete newTools[key];
  updateTools(newTools);
}
export function updateToolValue(tools, key, value, updateTools) {
  updateTools({
    ...(tools || {}),
    [key]: value,
  });
}
