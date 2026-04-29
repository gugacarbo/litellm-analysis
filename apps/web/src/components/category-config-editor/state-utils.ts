import type { CategoryConfig } from "@lite-llm/api-contracts/agent-routing";
import type { Dispatch, SetStateAction } from "react";

export function useConfigUpdaters(
  setConfig: Dispatch<SetStateAction<CategoryConfig>>,
) {
  const updateConfig = <K extends keyof CategoryConfig>(
    field: K,
    value: CategoryConfig[K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateThinkingConfig = <
    K extends keyof NonNullable<CategoryConfig["thinking"]>,
  >(
    field: K,
    value: NonNullable<CategoryConfig["thinking"]>[K],
  ) => {
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
