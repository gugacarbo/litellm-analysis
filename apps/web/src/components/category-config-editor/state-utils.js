export function useConfigUpdaters(setConfig) {
  const updateConfig = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const updateThinkingConfig = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      thinking: {
        ...(prev.thinking || { type: "enabled" }),
        [field]: value,
      },
    }));
  };
  return { updateConfig, updateThinkingConfig };
}
