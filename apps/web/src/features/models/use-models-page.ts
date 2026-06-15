import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  addModelToConfig,
  createModel,
  deleteModel,
  getDefaultSettingsDiff,
  getModelProvider,
  getModelsSyncDiff,
  getModelsWithConfig,
  type ModelConfig,
  type ModelSyncDiffItem,
  mergeModels,
  type SyncDirection,
  syncDefaultSettings,
  syncModelsBatch,
  toggleModelEnabled,
  updateModel,
  updateModelProvider,
} from "@/shared/lib/api-client";
import { validateAndBuildModelParams } from "./models-form-utils";
import { useLatestHealthChecks } from "./use-latest-health-checks";
import { useModelsFormState } from "./use-models-form-state";

export function useModelsPage() {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });

  const {
    checksByModel,
    getCheck,
    query: healthChecksQuery,
  } = useLatestHealthChecks();

  const credentialsQuery = useQuery({
    queryKey: ["credentials"],
    queryFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.getAllCredentials(),
      ),
  });

  const defaultCredentialQuery = useQuery({
    queryKey: ["default-credential"],
    queryFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.getDefaultCredential(),
      ),
  });

  const providerQuery = useQuery({
    queryKey: ["model-provider", "litellm"],
    queryFn: () => getModelProvider("litellm"),
  });

  const [providerDefaultCredential, setProviderDefaultCredential] =
    useState("");

  const updateProviderMutation = useMutation({
    mutationFn: (defaultCredential: string) =>
      updateModelProvider("litellm", { defaultCredential }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["model-provider", "litellm"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["default-credential"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
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

  const mergeModelsMutation = useMutation({
    mutationFn: (params: { sourceModel: string; targetModel: string }) =>
      mergeModels(params.sourceModel, params.targetModel),
  });

  const syncDiffQuery = useQuery({
    queryKey: ["models-sync-diff"],
    queryFn: getModelsSyncDiff,
    enabled: false,
  });

  const defaultSettingsDiffQuery = useQuery({
    queryKey: ["models-default-settings-diff"],
    queryFn: getDefaultSettingsDiff,
  });

  const syncMutation = useMutation({
    mutationFn: syncModelsBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
      queryClient.invalidateQueries({ queryKey: ["models-sync-diff"] });
    },
  });

  const syncDefaultSettingsMutation = useMutation({
    mutationFn: syncDefaultSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
      queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

  const addToConfigMutation = useMutation({
    mutationFn: (modelName: string) => addModelToConfig(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
    },
  });

  // Merge state
  const [mergeMode, setMergeMode] = useState(false);
  const [sourceModel, setSourceModel] = useState("");
  const [targetModel, setTargetModel] = useState("");
  const [merging, setMerging] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const {
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    setFormError,
    handleOpenCreate,
    handleOpenCreateWithDefaultCredential,
    addExtraParam,
    removeExtraParam,
    updateExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
  } = useModelsFormState();

  const [mutationError, setMutationError] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSelections, setSyncSelections] = useState<
    Record<string, SyncDirection>
  >({});

  const formLoading =
    createModelMutation.isPending || updateModelMutation.isPending;

  useEffect(() => {
    if (!providerQuery.data) return;
    setProviderDefaultCredential(providerQuery.data.defaultCredential);
  }, [providerQuery.data]);

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
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
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
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
      setDeleteModelName(null);
    } catch (e) {
      setMutationError(String(e));
    }
  }

  async function handleToggleEnabled(modelName: string, enabled: boolean) {
    try {
      await toggleModelEnabled(modelName, enabled);
      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    } catch (e) {
      setMutationError(String(e));
    }
  }

  function getSyncKey(modelName: string, field: ModelSyncDiffItem["field"]) {
    return `${modelName}::${field}`;
  }

  async function handleOpenSync() {
    setMutationError(null);
    const result = await syncDiffQuery.refetch();
    if (result.data) {
      const nextSelections: Record<string, SyncDirection> = {};
      for (const item of result.data.items) {
        nextSelections[getSyncKey(item.modelName, item.field)] =
          item.defaultDirection;
      }
      setSyncSelections(nextSelections);
    }
    setSyncDialogOpen(true);
  }

  function handleSyncSelectionChange(
    modelName: string,
    field: ModelSyncDiffItem["field"],
    direction: SyncDirection,
  ) {
    setSyncSelections((current) => ({
      ...current,
      [getSyncKey(modelName, field)]: direction,
    }));
  }

  async function handleApplySyncSelections() {
    const items = syncDiffQuery.data?.items ?? [];
    const selections = items.map((item) => ({
      modelName: item.modelName,
      field: item.field,
      direction:
        syncSelections[getSyncKey(item.modelName, item.field)] ??
        item.defaultDirection,
    }));
    await syncMutation.mutateAsync(selections);
    setSyncDialogOpen(false);
  }

  function handleMerge() {
    if (!sourceModel || !targetModel) {
      return;
    }
    if (sourceModel === targetModel) {
      return;
    }
    setMergeDialogOpen(true);
  }

  async function confirmMerge() {
    setMergeDialogOpen(false);
    setMerging(true);
    try {
      await mergeModelsMutation.mutateAsync({ sourceModel, targetModel });
      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });
      setMergeMode(false);
      setSourceModel("");
      setTargetModel("");
    } catch (e) {
      setMutationError(String(e));
    } finally {
      setMerging(false);
    }
  }

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
    providerLoading: providerQuery.isLoading,
    providerSaving: updateProviderMutation.isPending,
    providerError: providerQuery.error
      ? String(providerQuery.error)
      : updateProviderMutation.error
        ? String(updateProviderMutation.error)
        : null,
    providerDefaultCredential,
    handleProviderDefaultCredentialChange: async (value: string) => {
      setProviderDefaultCredential(value);
      await updateProviderMutation.mutateAsync(value);
    },
    handleAddToConfig: (modelName: string) =>
      addToConfigMutation.mutateAsync(modelName),
    handleDelete,
    handleMerge,
    confirmMerge,
    handleOpenCreate,
    handleOpenSync,
    handleApplySyncSelections,
    handleSyncSelectionChange,
    syncDialogOpen,
    setSyncDialogOpen,
    syncDiffItems: syncDiffQuery.data?.items ?? [],
    syncDiffLoading: syncDiffQuery.isFetching,
    syncSelections,
    syncing: syncMutation.isPending,
    defaultSettingsDriftCount: defaultSettingsDiffQuery.data?.count ?? 0,
    defaultSettingsMismatchedModels:
      defaultSettingsDiffQuery.data?.mismatchedModels ?? [],
    defaultSettingsLoading: defaultSettingsDiffQuery.isLoading,
    syncingDefaultSettings: syncDefaultSettingsMutation.isPending,
    handleSyncDefaultSettings: async () => {
      try {
        setMutationError(null);
        await syncDefaultSettingsMutation.mutateAsync();
      } catch (e) {
        setMutationError(String(e));
      }
    },
    models: modelsQuery.data?.models ?? [],
    healthChecksByModel: checksByModel,
    getHealthCheck: getCheck,
    healthChecksQuery,
    counts: modelsQuery.data?.counts ?? {
      synced: 0,
      configOnly: 0,
      litellmOnly: 0,
      total: 0,
    },
    handleOpenCreateWithDefaultCredential,
    handleToggleEnabled,
    handleSubmit,
    modelsQuery,
    mutationError,
    mergeDialogOpen,
    mergeMode,
    merging,
    removeExtraParam,
    setDeleteModelName,
    setDialogOpen,
    setFormData,
    setMergeDialogOpen,
    setMergeMode,
    setSourceModel,
    setTargetModel,
    sourceModel,
    targetModel,
    updateExtraParam,
  };
}
