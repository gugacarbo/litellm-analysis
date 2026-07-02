import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { RegistryProvider } from "@/shared/lib/api-client/providers";
import {
  getModelAliases,
  updateModelAliases,
} from "@/shared/lib/api-client/model-aliases";
import {
  type ModelConfig,
  type ModelRouteUpdate,
  type ModelWithStatus,
  resolveModelRoute,
  updateModel,
} from "@/shared/lib/api-client/models";
import { useModelDetailContext } from "./detail/model-detail-context";
import { parseExtraParamValue } from "./models-form-utils";

export interface ModelConfigFormData {
  displayName: string;
  family: string;
  ownedBy: string;
  aliases: string[];
  aliasesLoaded: boolean;
  aliasesLoading: boolean;
  aliasesLoadError: string | null;
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
    aliasesLoaded: false,
    aliasesLoading: false,
    aliasesLoadError: null,
    apiMode: "",
    vision: false,
    enabled: true,
    thinkingLevels: [],
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

function modelToFormData(model: ModelWithStatus): ModelConfigFormData {
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
  const validEffort =
    effort === "low" ||
    effort === "medium" ||
    effort === "high" ||
    effort === "xhigh"
      ? effort
      : "";

  const modelApiMode = config.apiMode;
  const validApiMode =
    modelApiMode === "openai" || modelApiMode === "anthropic"
      ? modelApiMode
      : "";

  const reasoningApiMode = reasoning?.apiMode;
  const validReasoningApiMode =
    reasoningApiMode === "openai" || reasoningApiMode === "anthropic"
      ? reasoningApiMode
      : "";

  return {
    displayName: (config.displayName as string) ?? route.displayName ?? "",
    family: (config.family as string) ?? route.family ?? "",
    ownedBy: (config.ownedBy as string) ?? route.ownedBy ?? "",
    aliases: [],
    aliasesLoaded: false,
    aliasesLoading: true,
    aliasesLoadError: null,
    enabled: model.enabled !== false,
    thinkingLevels: Array.isArray(config.thinking?.levels)
      ? config.thinking.levels
      : [],
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

function buildConfigFromFormData(
  formData: ModelConfigFormData,
): ModelConfig["config"] {
  const config: ModelConfig["config"] = {
    displayName: formData.displayName || undefined,
    family: formData.family || undefined,
    ownedBy: formData.ownedBy || undefined,
    apiMode: formData.apiMode || undefined,
    vision: formData.vision,
  };

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

function normalizeAliases(aliases: string[]): string[] {
  return aliases
    .map((alias) => alias.trim())
    .filter(Boolean)
    .filter(
      (alias, index, allAliases) =>
        allAliases.findIndex(
          (candidate) => candidate.toLowerCase() === alias.toLowerCase(),
        ) === index,
    );
}

function getAliasValidationError(aliases: string[]): string | null {
  const normalizedAliases = aliases.map((alias) => alias.trim());

  for (const alias of normalizedAliases) {
    if (!alias) {
      return "Manual aliases cannot be empty.";
    }
  }

  const uniqueAliases = new Set(
    normalizedAliases.map((alias) => alias.toLowerCase()),
  );

  if (uniqueAliases.size !== normalizedAliases.length) {
    return "Manual aliases must be unique for this model.";
  }

  return null;
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

export interface UseModelConfigPageResult {
  model: ModelWithStatus | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  formData: ModelConfigFormData;
  isDirty: boolean;
  saving: boolean;
  providers: RegistryProvider[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function useModelConfigPageFromContext(): Omit<
  UseModelConfigPageResult,
  "loading" | "error" | "notFound" | "model"
> & { model: ModelWithStatus | null } {
  const { model, providers } = useModelDetailContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const modelName = model?.modelName ?? "";

  const aliasesQuery = useQuery({
    queryKey: ["model-aliases", modelName],
    queryFn: () => getModelAliases(modelName),
    enabled: modelName.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: (params: {
      modelName: string;
      modelRoute: ModelRouteUpdate;
      config?: ModelConfig["config"];
    }) =>
      updateModel(
        params.modelName,
        params.modelRoute,
        undefined,
        params.config,
      ),
  });

  const [formData, setFormData] =
    useState<ModelConfigFormData>(getEmptyFormData);
  const [initialFormData, setInitialFormData] =
    useState<ModelConfigFormData>(getEmptyFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [aliasesTouched, setAliasesTouched] = useState(false);
  const hydratedAliasesModelRef = useRef<string | null>(null);
  const aliasErrorToastModelRef = useRef<string | null>(null);

  useEffect(() => {
    if (model) {
      const nextFormData = modelToFormData(model);
      setFormData(nextFormData);
      setInitialFormData(nextFormData);
      setAliasesTouched(false);
      hydratedAliasesModelRef.current = null;
      aliasErrorToastModelRef.current = null;
    } else {
      const emptyFormData = getEmptyFormData();
      setFormData(emptyFormData);
      setInitialFormData(emptyFormData);
      setAliasesTouched(false);
      hydratedAliasesModelRef.current = null;
      aliasErrorToastModelRef.current = null;
    }
  }, [model]);

  useEffect(() => {
    if (!modelName) {
      setFormData((prev) => ({
        ...prev,
        aliases: [],
        aliasesLoaded: false,
        aliasesLoading: false,
        aliasesLoadError: null,
      }));
      setInitialFormData((prev) => ({
        ...prev,
        aliases: [],
        aliasesLoaded: false,
        aliasesLoading: false,
        aliasesLoadError: null,
      }));
      return;
    }

    if (aliasesQuery.data) {
      const nextAliases = aliasesQuery.data.aliases;
      const shouldHydrateAliases =
        hydratedAliasesModelRef.current !== modelName && !aliasesTouched;

      hydratedAliasesModelRef.current = modelName;
      aliasErrorToastModelRef.current = null;

      setFormData((prev) => ({
        ...prev,
        aliases: shouldHydrateAliases ? nextAliases : prev.aliases,
        aliasesLoaded: true,
        aliasesLoading: false,
        aliasesLoadError: null,
      }));
      setInitialFormData((prev) => ({
        ...prev,
        aliases: shouldHydrateAliases ? nextAliases : prev.aliases,
        aliasesLoaded: true,
        aliasesLoading: false,
        aliasesLoadError: null,
      }));

      return;
    }

    if (aliasesQuery.isError) {
      const aliasLoadError =
        "Failed to load saved routing aliases. Model settings can still be " +
        "saved, but alias changes will stay local until aliases load " +
        "successfully.";

      const isNewModelOrUnhydrated =
        hydratedAliasesModelRef.current !== modelName;
      if (isNewModelOrUnhydrated) {
        hydratedAliasesModelRef.current = modelName;
      }
      aliasErrorToastModelRef.current = null;

      setFormData((prev) => ({
        ...prev,
        aliasesLoaded: false,
        aliasesLoading: false,
        aliasesLoadError: aliasLoadError,
      }));
      setInitialFormData((prev) => ({
        ...prev,
        aliasesLoaded: false,
        aliasesLoading: false,
        aliasesLoadError: aliasLoadError,
      }));

      if (
        isNewModelOrUnhydrated &&
        aliasErrorToastModelRef.current !== modelName
      ) {
        aliasErrorToastModelRef.current = modelName;
        toast.error(aliasLoadError);
      }

      return;
    }

    if (aliasesQuery.isPending) {
      setFormData((prev) => ({
        ...prev,
        aliasesLoading: true,
        aliasesLoadError: null,
      }));
      setInitialFormData((prev) => ({
        ...prev,
        aliasesLoading: true,
        aliasesLoadError: null,
      }));
    }
  }, [
    aliasesTouched,
    aliasesQuery.data,
    aliasesQuery.isError,
    aliasesQuery.isPending,
    modelName,
  ]);

  const handleFormDataChange = useCallback(
    (next: ModelConfigFormData) => {
      if (JSON.stringify(formData.aliases) !== JSON.stringify(next.aliases)) {
        setAliasesTouched(true);
      }

      setFormData(next);
    },
    [formData.aliases],
  );

  const handleAddExtraParam = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, "": "" },
    }));
  }, []);

  const handleRemoveExtraParam = useCallback((key: string) => {
    setFormData((prev) => {
      const { [key]: _, ...rest } = prev.extraParams;
      return { ...prev, extraParams: rest };
    });
  }, []);

  const handleUpdateExtraParam = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [key]: value },
    }));
  }, []);

  const isDirty = !areFormDataEqual(formData, initialFormData);

  const handleSave = useCallback(async () => {
    if (!model) return;

    try {
      setIsSaving(true);

      const inputCost = formData.inputCostPerToken.trim()
        ? Number(formData.inputCostPerToken)
        : undefined;
      const outputCost = formData.outputCostPerToken.trim()
        ? Number(formData.outputCostPerToken)
        : undefined;

      if (
        inputCost !== undefined &&
        (!Number.isFinite(inputCost) || inputCost < 0)
      ) {
        toast.error("Input cost must be a valid non-negative number");
        return;
      }

      if (
        outputCost !== undefined &&
        (!Number.isFinite(outputCost) || outputCost < 0)
      ) {
        toast.error("Output cost must be a valid non-negative number");
        return;
      }

      const existingRoute = resolveModelRoute(model);
      const {
        displayName: _displayName,
        family: _family,
        ownedBy: _ownedBy,
        apiMode: _apiMode,
        vision: _vision,
        ...existingRouteRest
      } = existingRoute;
      const routeUpdate: ModelRouteUpdate = {
        ...existingRouteRest,
        upstreamBaseUrl: formData.apiBase || undefined,
        providerName: formData.providerName || undefined,
        enabled: formData.enabled,
        inputCostPerToken: inputCost,
        outputCostPerToken: outputCost,
        requestOptions: { ...existingRoute.requestOptions },
      };

      if (inputCost === undefined) {
        delete routeUpdate.inputCostPerToken;
      }
      if (outputCost === undefined) {
        delete routeUpdate.outputCostPerToken;
      }

      const requestOptions = { ...routeUpdate.requestOptions };
      for (const [key, value] of Object.entries(formData.extraParams)) {
        if (!key) {
          continue;
        }
        const parsed = parseExtraParamValue(value);
        if (parsed !== undefined) {
          requestOptions[key] = parsed;
        } else {
          delete requestOptions[key];
        }
      }
      routeUpdate.requestOptions =
        Object.keys(requestOptions).length > 0 ? requestOptions : undefined;

      const nextAliases = normalizeAliases(formData.aliases);
      const aliasValidationError = getAliasValidationError(formData.aliases);

      if (formData.aliasesLoaded && aliasValidationError) {
        toast.error(aliasValidationError);
        return;
      }

      await updateMutation.mutateAsync({
        modelName: model.modelName,
        modelRoute: routeUpdate,
        config: buildConfigFromFormData(formData),
      });

      if (!formData.aliasesLoaded) {
        await queryClient.invalidateQueries({
          queryKey: ["models-with-config"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["model-aliases", model.modelName],
        });

        setInitialFormData((prev) => ({
          ...formData,
          aliases: prev.aliases,
          aliasesLoaded: false,
          aliasesLoading: false,
          aliasesLoadError:
            formData.aliasesLoadError ??
            "Routing aliases were not loaded, so alias changes were not saved.",
        }));

        toast.error(
          "Model settings saved, but routing aliases were not loaded, so " +
            "alias changes were not saved.",
        );
        return;
      }

      try {
        await updateModelAliases(model.modelName, nextAliases);

        await queryClient.invalidateQueries({
          queryKey: ["models-with-config"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["model-aliases", model.modelName],
        });

        setAliasesTouched(false);
        setFormData((prev) => ({
          ...prev,
          aliases: nextAliases,
          aliasesLoaded: true,
          aliasesLoading: false,
          aliasesLoadError: null,
        }));
        setInitialFormData({
          ...formData,
          aliases: nextAliases,
          aliasesLoaded: true,
          aliasesLoading: false,
          aliasesLoadError: null,
        });
        toast.success("Model configuration and routing aliases saved");
      } catch (aliasError) {
        await queryClient.invalidateQueries({
          queryKey: ["models-with-config"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["model-aliases", model.modelName],
        });

        toast.error(
          "Model settings saved, but manual routing aliases failed to save. " +
            `Latest saved aliases were reloaded. ${String(aliasError)}`,
        );
      }
    } catch (e) {
      toast.error(`Failed to save: ${e}`);
    } finally {
      setIsSaving(false);
    }
  }, [model, formData, updateMutation, queryClient]);

  return {
    model,
    formData,
    isDirty,
    saving: isSaving || updateMutation.isPending,
    providers,
    onFormDataChange: handleFormDataChange,
    onAddExtraParam: handleAddExtraParam,
    onRemoveExtraParam: handleRemoveExtraParam,
    onUpdateExtraParam: handleUpdateExtraParam,
    onSave: handleSave,
    onBack: () => navigate("/models"),
  };
}
