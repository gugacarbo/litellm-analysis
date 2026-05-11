import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createModel,
  deleteModel,
  getAllModels,
  type ModelConfig,
  updateModel,
} from "../../lib/api-client";
import { getModelsHealth } from "../../lib/api-client/monitor";
import { queryKeys } from "../../lib/query-keys";
import { validateAndBuildModelParams } from "./models-form-utils";
import { useModelsFormState } from "./use-models-form-state";

export function useModelsPage() {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const modelsHealthQuery = useQuery({
    queryKey: ["models-health"],
    queryFn: async () => {
      const result = await getModelsHealth();
      console.log("[DEBUG] modelsHealth response:", result);
      return result;
    },
  });

  const credentialsQuery = useQuery({
    queryKey: ["credentials"],
    queryFn: () =>
      import("../../lib/api-client/credentials").then((m) =>
        m.getAllCredentials(),
      ),
  });

  const defaultCredentialQuery = useQuery({
    queryKey: ["default-credential"],
    queryFn: () =>
      import("../../lib/api-client/credentials").then((m) =>
        m.getDefaultCredential(),
      ),
  });

  const createModelMutation = useMutation({
    mutationFn: (model: ModelConfig) => createModel(model),
  });

  const updateModelMutation = useMutation({
    mutationFn: (params: {
      modelName: string;
      litellmParams: Record<string, unknown>;
      newName?: string;
    }) => updateModel(params.modelName, params.litellmParams, params.newName),
  });

  const deleteModelMutation = useMutation({
    mutationFn: (modelName: string) => deleteModel(modelName),
  });

  const {
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    setFormError,
    handleOpenCreate,
    handleOpenCreateWithDefaultCredential,
    handleOpenEdit,
    addExtraParam,
    removeExtraParam,
    updateExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
  } = useModelsFormState();

  const [mutationError, setMutationError] = useState<string | null>(null);

  const formLoading =
    createModelMutation.isPending || updateModelMutation.isPending;

  async function handleSubmit() {
    setFormError(null);
    setMutationError(null);

    try {
      const { params, error } = validateAndBuildModelParams(formData);
      if (error) {
        setFormError(error);
        return;
      }

      if (editingModel) {
        await updateModelMutation.mutateAsync({
          modelName: editingModel.modelName,
          litellmParams: params,
        });
      } else {
        await createModelMutation.mutateAsync({
          modelName: formData.modelName.trim(),
          litellmParams: params,
        });
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.models });
      setDialogOpen(false);
    } catch (e) {
      setFormError(String(e));
    }
  }

  async function handleDelete() {
    if (!deleteModelName) return;

    try {
      setMutationError(null);
      await deleteModelMutation.mutateAsync(deleteModelName);
      await queryClient.invalidateQueries({ queryKey: queryKeys.models });
      setDeleteModelName(null);
    } catch (e) {
      setMutationError(String(e));
    }
  }

  console.log(
    "[DEBUG] modelsHealth from hook:",
    modelsHealthQuery.data?.models,
  );

  return {
    addExtraParam,
    credentials: credentialsQuery.data ?? [],
    defaultCredential: defaultCredentialQuery.data?.defaultCredential ?? null,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    setFormError,
    formLoading,
    handleDelete,
    handleOpenCreate,
    modelsHealth: modelsHealthQuery.data?.models ?? [],
    handleOpenCreateWithDefaultCredential,
    handleOpenEdit,
    handleSubmit,
    modelsQuery,
    mutationError,
    removeExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    updateExtraParam,
  };
}
