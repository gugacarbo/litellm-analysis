import { useCallback, useState } from "react";
import {
  type ModelConfig,
  type ModelWithStatus,
  resolveModelRoute,
} from "@/shared/lib/api-client/models";

const DEFAULT_THINKING_LEVELS = ["low", "medium", "high", "xhigh"] as const;

export interface ModelConfigFormData {
  displayName: string;
  family: string;
  ownedBy: string;
  aliases: string[];
  apiMode: "openai" | "anthropic" | "";
  vision: boolean;
  enabled: boolean;
  thinkingLevels: string[];
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high" | "xhigh" | "";
    apiMode: "openai" | "anthropic" | "";
    enableThinking: boolean;
    includeReasoningInRequest: boolean;
  };
  apiBase: string;
  providerName: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  extraParams: Record<string, string>;
}

function getEmptyFormData(): ModelConfigFormData {
  return {
    displayName: "",
    family: "",
    ownedBy: "",
    aliases: [],
    apiMode: "",
    vision: false,
    enabled: true,
    thinkingLevels: [...DEFAULT_THINKING_LEVELS],
    reasoning: {
      enabled: false,
      effort: "",
      apiMode: "",
      enableThinking: false,
      includeReasoningInRequest: false,
    },
    apiBase: "",
    providerName: "",
    inputCostPerToken: "",
    outputCostPerToken: "",
    extraParams: {},
  };
}

export function modelToFormData(model: ModelWithStatus): ModelConfigFormData {
  const route = resolveModelRoute(model);
  const config = model.config ?? {};
  const extraParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(route.requestOptions ?? {})) {
    if (value !== undefined) {
      extraParams[key] = String(value);
    }
  }

  const providerName = route.providerName ?? "";

  const reasoning = config.reasoning;
  const effort = reasoning?.effort;
  const validEffort: ModelConfigFormData["reasoning"]["effort"] =
    effort === "low" ||
    effort === "medium" ||
    effort === "high" ||
    effort === "xhigh"
      ? effort
      : "";

  const modelApiMode = config.apiMode;
  const validApiMode: ModelConfigFormData["apiMode"] =
    modelApiMode === "openai" || modelApiMode === "anthropic"
      ? modelApiMode
      : "";

  const reasoningApiMode = reasoning?.apiMode;
  const validReasoningApiMode: ModelConfigFormData["reasoning"]["apiMode"] =
    reasoningApiMode === "openai" || reasoningApiMode === "anthropic"
      ? reasoningApiMode
      : "";

  return {
    displayName: (config.displayName as string) ?? route.displayName ?? "",
    family: (config.family as string) ?? route.family ?? "",
    ownedBy: (config.ownedBy as string) ?? route.ownedBy ?? "",
    aliases: [],
    enabled: model.enabled !== false,
    thinkingLevels:
      Array.isArray(config.thinking?.levels) &&
      config.thinking.levels.length > 0
        ? config.thinking.levels
        : [...DEFAULT_THINKING_LEVELS],
    reasoning: {
      enabled: reasoning !== undefined,
      effort: validEffort,
      apiMode: validReasoningApiMode,
      enableThinking: reasoning?.enableThinking === true,
      includeReasoningInRequest: reasoning?.includeReasoningInRequest === true,
    },
    apiMode: validApiMode,
    vision: config.vision === true,
    apiBase: route.upstreamBaseUrl ?? "",
    providerName,
    inputCostPerToken: route.inputCostPerToken?.toString() ?? "",
    outputCostPerToken: route.outputCostPerToken?.toString() ?? "",
    extraParams,
  };
}

export function buildConfigFromFormData(
  formData: ModelConfigFormData,
): ModelConfig["config"] {
  const config: ModelConfig["config"] = {
    displayName: formData.displayName,
    family: formData.family || undefined,
    apiMode: formData.apiMode || undefined,
    vision: formData.vision,
  };

  if (formData.ownedBy) {
    config.ownedBy = formData.ownedBy;
  }

  if (formData.thinkingLevels.length > 0) {
    config.thinking = { levels: formData.thinkingLevels };
  }

  if (formData.reasoning.enabled) {
    config.reasoning = {
      effort: formData.reasoning.effort || undefined,
      apiMode: formData.reasoning.apiMode || undefined,
      enableThinking: formData.reasoning.enableThinking,
      includeReasoningInRequest: formData.reasoning.includeReasoningInRequest,
    };
  }

  return config;
}

function getComparableFormData(formData: ModelConfigFormData) {
  return {
    displayName: formData.displayName,
    family: formData.family,
    ownedBy: formData.ownedBy,
    aliases: formData.aliases,
    apiMode: formData.apiMode,
    vision: formData.vision,
    enabled: formData.enabled,
    thinkingLevels: formData.thinkingLevels,
    reasoning: formData.reasoning,
    apiBase: formData.apiBase,
    providerName: formData.providerName,
    inputCostPerToken: formData.inputCostPerToken,
    outputCostPerToken: formData.outputCostPerToken,
    extraParams: formData.extraParams,
  };
}

function areFormDataEqual(
  left: ModelConfigFormData,
  right: ModelConfigFormData,
): boolean {
  return (
    JSON.stringify(getComparableFormData(left)) ===
    JSON.stringify(getComparableFormData(right))
  );
}

export interface UseModelConfigFormResult {
  formData: ModelConfigFormData;
  initialFormData: ModelConfigFormData;
  isDirty: boolean;
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  resetFormForModel: (model: ModelWithStatus | null) => void;
  commitSavedFormData: (next: ModelConfigFormData) => void;
}

/**
 * Pure form-state hook. Reset is intentionally driven by the consumer via
 * {@link resetFormForModel}; this hook does not auto-reset when the model
 * changes and owns no model context.
 */
export function useModelConfigForm(): UseModelConfigFormResult {
  const [formData, setFormData] = useState<ModelConfigFormData>(
    getEmptyFormData(),
  );
  const [initialFormData, setInitialFormData] = useState<ModelConfigFormData>(
    getEmptyFormData(),
  );

  /**
   * Resets the form state to match the given model. Reset is intentionally
   * driven by the consumer; this hook owns pure state and does not subscribe
   * to model context.
   */
  const resetFormForModel = useCallback((model: ModelWithStatus | null) => {
    const nextFormData = model ? modelToFormData(model) : getEmptyFormData();
    setFormData(nextFormData);
    setInitialFormData(nextFormData);
  }, []);

  const onFormDataChange = useCallback((next: ModelConfigFormData) => {
    setFormData(next);
  }, []);

  const onAddExtraParam = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, "": "" },
    }));
  }, []);

  const onRemoveExtraParam = useCallback((key: string) => {
    setFormData((prev) => {
      const { [key]: _, ...rest } = prev.extraParams;
      return { ...prev, extraParams: rest };
    });
  }, []);

  const onUpdateExtraParam = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [key]: value },
    }));
  }, []);

  const commitSavedFormData = useCallback((next: ModelConfigFormData) => {
    setFormData(next);
    setInitialFormData(next);
  }, []);

  return {
    formData,
    initialFormData,
    isDirty: !areFormDataEqual(formData, initialFormData),
    onFormDataChange,
    onAddExtraParam,
    onRemoveExtraParam,
    onUpdateExtraParam,
    resetFormForModel,
    commitSavedFormData,
  };
}
