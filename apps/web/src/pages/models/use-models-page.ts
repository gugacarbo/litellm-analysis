import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerMode } from "../../hooks/use-server-mode";
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
import { EMPTY_MODEL_FORM_DATA, type ModelFormData } from "./model-form-data";
import { getAllAliasesSorted } from "./models-alias-utils";
import {
  mapModelToFormData,
  validateAndBuildModelParams,
} from "./models-form-utils";

export function useModelsPage() {
  const queryClient = useQueryClient();
  const { mode, capabilities } = useServerMode();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const aliasesQuery = useQuery({
    queryKey: queryKeys.agentRoutingAliases,
    queryFn: getAgentRoutingConfig,
    enabled: capabilities.agentRouting,
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [deleteModelName, setDeleteModelName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [aliasMutationError, setAliasMutationError] = useState<string | null>(
    null,
  );
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<"add" | "edit">("add");
  const [aliasDialogKey, setAliasDialogKey] = useState("");
  const [aliasDialogValue, setAliasDialogValue] = useState("");
  const [formData, setFormData] = useState<ModelFormData>(
    EMPTY_MODEL_FORM_DATA,
  );

  const formLoading =
    createModelMutation.isPending || updateModelMutation.isPending;

  function handleOpenCreate() {
    setEditingModel(null);
    setFormData(EMPTY_MODEL_FORM_DATA);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(model: ModelConfig) {
    setEditingModel(model);
    setFormData(mapModelToFormData(model));
    setFormError(null);
    setDialogOpen(true);
  }

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
        const newName =
          mode === "limited" && formData.modelName !== editingModel.modelName
            ? formData.modelName
            : undefined;

        await updateModelMutation.mutateAsync({
          modelName: editingModel.modelName,
          litellmParams: params,
          newName,
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

  function addExtraParam() {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [crypto.randomUUID()]: "" },
    }));
  }

  function removeExtraParam(key: string) {
    setFormData((prev) => {
      const next = { ...prev.extraParams };
      delete next[key];
      return { ...prev, extraParams: next };
    });
  }

  function updateExtraParam(key: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      extraParams: { ...prev.extraParams, [key]: value },
    }));
  }

  const customAliases = useMemo(
    () => getAllAliasesSorted(aliasesQuery.data),
    [aliasesQuery.data],
  );

  function openAddAlias() {
    setAliasDialogMode("add");
    setAliasDialogKey("");
    setAliasDialogValue("");
    setAliasMutationError(null);
    setAliasDialogOpen(true);
  }

  function openEditAlias(key: string, value: string) {
    setAliasDialogMode("edit");
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasMutationError(null);
    setAliasDialogOpen(true);
  }

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
    aliasesError,
    aliasesLoading,
    aliasDialogKey,
    aliasDialogMode,
    aliasDialogOpen,
    aliasDialogValue,
    capabilities,
    customAliases,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    formLoading,
    mode,
    modelsQuery,
    mutationError,
    updateAgentRoutingMutation,
    handleAliasDelete,
    handleAliasSave,
    handleDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    openAddAlias,
    openEditAlias,
    addExtraParam,
    removeExtraParam,
    setAliasDialogKey,
    setAliasDialogOpen,
    setAliasDialogValue,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    updateExtraParam,
  };
}
