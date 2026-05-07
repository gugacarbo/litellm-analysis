export function addTool(newToolKey, newToolValue, setConfig, setNewToolKey) {
  if (!newToolKey.trim()) return;
  setConfig((prev) => ({
    ...prev,
    tools: {
      ...(prev.tools || {}),
      [newToolKey.trim()]: newToolValue,
    },
  }));
  setNewToolKey("");
}
export function removeTool(key, setConfig) {
  setConfig((prev) => {
    const newTools = { ...(prev.tools || {}) };
    delete newTools[key];
    return { ...prev, tools: newTools };
  });
}
export function updateToolValue(key, value, setConfig) {
  setConfig((prev) => ({
    ...prev,
    tools: {
      ...(prev.tools || {}),
      [key]: value,
    },
  }));
}
