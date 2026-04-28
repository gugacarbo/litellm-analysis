import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  type AgentRoutingAPIResponse,
  createModel,
  deleteModel,
  getAgentRoutingConfig,
  getAllModels,
  type ModelConfig,
  updateAgentRoutingConfig,
  updateModel,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";
import { getAllAliasesSorted } from "./models-alias-utils";
import { validateAndBuildModelParams } from "./models-form-utils";
import { useModelsAliasState } from "./use-models-alias-state";
import { useModelsFormState } from "./use-models-form-state";

export function useModelsPage() {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const aliasesQuery = useQuery({
    queryKey: queryKeys.agentRoutingAliases,
    queryFn: getAgentRoutingConfig,
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

  const updateAgentRoutingMutation = useMutation({
    mutationFn: (modelGroupAlias: AgentRoutingAPIResponse) =>
      updateAgentRoutingConfig(modelGroupAlias),
  });

  const {
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    handleOpenCreate,
    handleOpenEdit,
    addExtraParam,
    removeExtraParam,
    updateExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
  } = useModelsFormState();

  const {
    aliasDialogKey,
    aliasDialogMode,
    aliasDialogOpen,
    aliasDialogValue,
    aliasMutationError,
    openAddAlias,
    openEditAlias,
    setAliasDialogKey,
    setAliasDialogOpen,
    setAliasDialogValue,
    setAliasMutationError,
  } = useModelsAliasState();

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

  const customAliases = useMemo(
    () => getAllAliasesSorted(aliasesQuery.data),
    [aliasesQuery.data],
  );

  async function handleAliasSave() {
    const key = aliasDialogKey.trim();
    const value = aliasDialogValue.trim();
    if (!key || !value) return;

    try {
      setAliasMutationError(null);
      await updateAgentRoutingMutation.mutateAsync({ [key]: value });

      queryClient.setQueryData<AgentRoutingAPIResponse>(
        queryKeys.agentRoutingAliases,
        (previous) => ({ ...(previous ?? {}), [key]: value }),
      );

      setAliasDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    } catch (e) {
      setAliasMutationError(String(e));
    }
  }

  async function handleAliasDelete(key: string) {
    try {
      setAliasMutationError(null);
      await updateAgentRoutingMutation.mutateAsync({ [key]: "" });

      queryClient.setQueryData<AgentRoutingAPIResponse>(
        queryKeys.agentRoutingAliases,
        (previous) => {
          if (!previous) return previous;
          const next = { ...previous };
          delete next[key];
          return next;
        },
      );

      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentRoutingData,
      });
    } catch (e) {
      setAliasMutationError(String(e));
    }
  }

  const aliasesLoading = aliasesQuery.isPending && !aliasesQuery.data;
  const aliasesError =
    aliasMutationError ||
    (aliasesQuery.error instanceof Error ? aliasesQuery.error.message : null);

  return {
    addExtraParam,
    aliasDialogKey,
    aliasDialogMode,
    aliasDialogOpen,
    aliasDialogValue,
    aliasesError,
    aliasesLoading,
    customAliases,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    formLoading,
    handleAliasDelete,
    handleAliasSave,
    handleDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    modelsQuery,
    mutationError,
    openAddAlias,
    openEditAlias,
    removeExtraParam,
    setAliasDialogKey,
    setAliasDialogOpen,
    setAliasDialogValue,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    updateAgentRoutingMutation,
    updateExtraParam,
  };
}
