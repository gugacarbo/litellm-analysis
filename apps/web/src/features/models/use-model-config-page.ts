import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { LiteLLMCredential } from "@/shared/lib/api-client/credentials";
import {
  getModelsWithConfig,
  type ModelWithStatus,
  updateModel,
} from "@/shared/lib/api-client/models";

export interface ModelConfigFormData {
  displayName: string;
  family: string;
  enabled: boolean;
  thinkingLevels: string[];
  apiBase: string;
  credentialName: string;
  extraParams: Record<string, string>;
}

function getEmptyFormData(): ModelConfigFormData {
  return {
    displayName: "",
    family: "",
    enabled: true,
    thinkingLevels: [],
    apiBase: "",
    credentialName: "",
    extraParams: {},
  };
}

function modelToFormData(model: ModelWithStatus): ModelConfigFormData {
  const params = model.litellmParams;
  const extraParams: Record<string, string> = {};
  const fixedKeys = [
    "api_base",
    "input_cost_per_token",
    "output_cost_per_token",
    "context_window_size",
    "max_tokens",
    "litellm_credential_name",
    "enabled",
  ];

  if (params && typeof params === "object") {
    for (const [key, value] of Object.entries(params)) {
      if (!fixedKeys.includes(key) && value !== undefined) {
        extraParams[key] = String(value);
      }
    }
  }

  const litellmCredName = params?.litellm_credential_name as string | undefined;
  let credentialName = "";
  if (litellmCredName) {
    credentialName = litellmCredName;
  }

  return {
    displayName: "",
    family: "",
    enabled: model.enabled !== false,
    thinkingLevels: [],
    apiBase: (params?.api_base as string) ?? "",
    credentialName,
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
  credentials: LiteLLMCredential[];
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
      import("@/lib/api-client/credentials").then((m) => m.getAllCredentials()),
  });

  const updateMutation = useMutation({
    mutationFn: (params: {
      modelName: string;
      litellmParams: Record<string, unknown>;
    }) => updateModel(params.modelName, params.litellmParams),
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
      const litellmParams: Record<string, unknown> = {
        ...model.litellmParams,
        api_base: formData.apiBase || undefined,
        litellm_credential_name: formData.credentialName || undefined,
        enabled: formData.enabled,
      };

      for (const [key, value] of Object.entries(formData.extraParams)) {
        if (key && value) {
          litellmParams[key] = value;
        }
      }

      await updateMutation.mutateAsync({
        modelName: model.modelName,
        litellmParams,
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
