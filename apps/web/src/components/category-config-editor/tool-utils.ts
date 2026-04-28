import type { Dispatch, SetStateAction } from "react";
import type { CategoryConfig } from "../../types/agent-routing";

export function addTool(
  newToolKey: string,
  newToolValue: boolean,
  setConfig: Dispatch<SetStateAction<CategoryConfig>>,
  setNewToolKey: Dispatch<SetStateAction<string>>,
) {
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

export function removeTool(
  key: string,
  setConfig: Dispatch<SetStateAction<CategoryConfig>>,
) {
  setConfig((prev) => {
    const newTools = { ...(prev.tools || {}) };
    delete newTools[key];
    return { ...prev, tools: newTools };
  });
}

export function updateToolValue(
  key: string,
  value: boolean,
  setConfig: Dispatch<SetStateAction<CategoryConfig>>,
) {
  setConfig((prev) => ({
    ...prev,
    tools: {
      ...(prev.tools || {}),
      [key]: value,
    },
  }));
}
