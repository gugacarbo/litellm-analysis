import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  addModelToConfig,
  createModel,
  deleteModel,
  getModelsWithConfig,
  type ModelConfig,
  syncModelsFromConfig,
  updateModel,
} from "../../lib/api-client";
import { getModelsHealth } from "../../lib/api-client/monitor";
import { validateAndBuildModelParams } from "./models-form-utils";
import { useModelsFormState } from "./use-models-form-state";

export function useModelsPage() {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
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

  const syncMutation = useMutation({
    mutationFn: syncModelsFromConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
    },
  });

  const addToConfigMutation = useMutation({
    mutationFn: (modelName: string) => addModelToConfig(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
    },
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

      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });
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
      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });
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
    addToConfigPending: addToConfigMutation.isPending,
    credentials: credentialsQuery.data ?? [],
    defaultCredential: defaultCredentialQuery.data?.defaultCredential ?? null,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    setFormError,
    formLoading,
    handleAddToConfig: (modelName: string) =>
      addToConfigMutation.mutateAsync(modelName),
    handleDelete,
    handleOpenCreate,
    handleSyncFromConfig: () => syncMutation.mutateAsync(),
    syncing: syncMutation.isPending,
    models: modelsQuery.data?.models ?? [],
    modelsHealth: modelsHealthQuery.data?.models ?? [],
    counts: modelsQuery.data?.counts ?? {
      synced: 0,
      configOnly: 0,
      litellmOnly: 0,
      total: 0,
    },
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
