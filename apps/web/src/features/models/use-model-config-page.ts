import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { RegistryCredential } from "@/shared/lib/api-client/credentials";
import {
  getModelsWithConfig,
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
  credentialName: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  extraParams: Record<string, string>;
}

function getEmptyFormData(): ModelConfigFormData {
  return {
    displayName: "",
    family: "",
    ownedBy: "",
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
    credentialName: "",
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

  const credentialName = route.credentialName ?? "";

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
    displayName: (config.displayName as string) ?? "",
    family: (config.family as string) ?? "",
    ownedBy: (config.ownedBy as string) ?? "",
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
    credentialName,
    inputCostPerToken: route.inputCostPerToken?.toString() ?? "",
    outputCostPerToken: route.outputCostPerToken?.toString() ?? "",
    extraParams,
  };
}

export interface UseModelConfigPageResult {
  model: ModelWithStatus | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  formData: ModelConfigFormData;
  isDirty: boolean;
  saving: boolean;
  credentials: RegistryCredential[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function useModelConfigPage(): UseModelConfigPageResult {
  const { modelName } = useParams() as { modelName: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });

  const credentialsQuery = useQuery({
    queryKey: ["credentials"],
    queryFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.getAllCredentials(),
      ),
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

  const model = useMemo(() => {
    if (!modelsQuery.data) return null;
    return (
      modelsQuery.data.models.find((m) => m.modelName === modelName) ?? null
    );
  }, [modelsQuery.data, modelName]);

  const [formData, setFormData] =
    useState<ModelConfigFormData>(getEmptyFormData);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData(modelToFormData(model));
      setIsDirty(false);
    }
  }, [model]);

  const handleFormDataChange = useCallback((next: ModelConfigFormData) => {
    setFormData(next);
    setIsDirty(true);
  }, []);

  const handleAddExtraParam = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, "": "" },
    }));
    setIsDirty(true);
  }, []);

  const handleRemoveExtraParam = useCallback((key: string) => {
    setFormData((prev) => {
      const { [key]: _, ...rest } = prev.extraParams;
      return { ...prev, extraParams: rest };
    });
    setIsDirty(true);
  }, []);

  const handleUpdateExtraParam = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [key]: value },
    }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!model) return;

    try {
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
      const routeUpdate: ModelRouteUpdate = {
        ...existingRoute,
        upstreamBaseUrl: formData.apiBase || undefined,
        credentialName: formData.credentialName || undefined,
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

      await updateMutation.mutateAsync({
        modelName: model.modelName,
        modelRoute: routeUpdate,
      });

      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });

      toast.success("Model configuration saved");
      setIsDirty(false);
    } catch (e) {
      toast.error(`Failed to save: ${e}`);
    }
  }, [model, formData, updateMutation, queryClient]);

  const loading =
    modelsQuery.isPending || (modelsQuery.isFetching && !modelsQuery.data);

  const error = modelsQuery.error ? String(modelsQuery.error) : null;
  const notFound = !loading && modelsQuery.data !== undefined && model === null;

  return {
    model,
    loading,
    error,
    notFound,
    formData,
    isDirty,
    saving: updateMutation.isPending,
    credentials: credentialsQuery.data ?? [],
    onFormDataChange: handleFormDataChange,
    onAddExtraParam: handleAddExtraParam,
    onRemoveExtraParam: handleRemoveExtraParam,
    onUpdateExtraParam: handleUpdateExtraParam,
    onSave: handleSave,
    onBack: () => navigate("/models"),
  };
}

export function useModelConfigPageFromContext(): Omit<
  UseModelConfigPageResult,
  "loading" | "error" | "notFound" | "model"
> & { model: ModelWithStatus | null } {
  const { model, credentials } = useModelDetailContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData(modelToFormData(model));
      setIsDirty(false);
    }
  }, [model]);

  const handleFormDataChange = useCallback((next: ModelConfigFormData) => {
    setFormData(next);
    setIsDirty(true);
  }, []);

  const handleAddExtraParam = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, "": "" },
    }));
    setIsDirty(true);
  }, []);

  const handleRemoveExtraParam = useCallback((key: string) => {
    setFormData((prev) => {
      const { [key]: _, ...rest } = prev.extraParams;
      return { ...prev, extraParams: rest };
    });
    setIsDirty(true);
  }, []);

  const handleUpdateExtraParam = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [key]: value },
    }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!model) return;

    try {
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
      const routeUpdate: ModelRouteUpdate = {
        ...existingRoute,
        upstreamBaseUrl: formData.apiBase || undefined,
        credentialName: formData.credentialName || undefined,
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

      await updateMutation.mutateAsync({
        modelName: model.modelName,
        modelRoute: routeUpdate,
      });

      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });

      toast.success("Model configuration saved");
      setIsDirty(false);
    } catch (e) {
      toast.error(`Failed to save: ${e}`);
    }
  }, [model, formData, updateMutation, queryClient]);

  return {
    model,
    formData,
    isDirty,
    saving: updateMutation.isPending,
    credentials,
    onFormDataChange: handleFormDataChange,
    onAddExtraParam: handleAddExtraParam,
    onRemoveExtraParam: handleRemoveExtraParam,
    onUpdateExtraParam: handleUpdateExtraParam,
    onSave: handleSave,
    onBack: () => navigate("/models"),
  };
}
