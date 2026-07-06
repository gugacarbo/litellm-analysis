import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  addModelToConfig,
  createModel,
  deleteModel,
  exportConsumerConfigs,
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
import type {
  OpenAiOAuthConnectionStatus,
  OpenAiOAuthDeviceCodeStartResult,
  RegistryProvider,
} from "@/shared/lib/api-client/providers";
import {
  createProvider,
  deleteProvider,
  type ProviderInput,
  type ProviderUpdateInput,
  updateProvider,
} from "@/shared/lib/api-client/providers";
import { mergeRegistryModelsWithConfigAliases } from "./model-display";
import { validateAndBuildModelRoute } from "./models-form-utils";
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

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () =>
      import("@/shared/lib/api-client/providers").then((m) =>
        m.getAllProviders(),
      ),
  });

  const defaultProviderQuery = useQuery({
    queryKey: ["default-provider"],
    queryFn: () =>
      import("@/shared/lib/api-client/providers").then((m) =>
        m.getDefaultProvider(),
      ),
  });

  const providerQuery = useQuery({
    queryKey: ["model-provider", "local-proxy"],
    queryFn: () => getModelProvider("local-proxy"),
  });

  const openAiOAuthQuery = useQuery({
    queryKey: ["openai-oauth-connection"],
    queryFn: () =>
      import("@/shared/lib/api-client/providers").then((m) =>
        m.getOpenAiOAuthConnectionStatus(),
      ),
  });

  const [providerDefaultProvider, setProviderDefaultProvider] = useState("");
  const [oauthDeviceFlow, setOauthDeviceFlow] =
    useState<OpenAiOAuthDeviceCodeStartResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const updateModelProxyProviderMutation = useMutation({
    mutationFn: (defaultProvider: string) =>
      updateModelProvider("local-proxy", { defaultProvider }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["model-provider", "local-proxy"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["default-provider"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

  const startOpenAiOAuthMutation = useMutation({
    mutationFn: () =>
      import("@/shared/lib/api-client/providers").then((m) =>
        m.startOpenAiOAuthDeviceFlow(),
      ),
  });

  const pollOpenAiOAuthMutation = useMutation({
    mutationFn: (input: { deviceAuthId: string; userCode: string }) =>
      import("@/shared/lib/api-client/providers").then((m) =>
        m.pollOpenAiOAuthDeviceFlow(input),
      ),
  });

  const disconnectOpenAiOAuthMutation = useMutation({
    mutationFn: () =>
      import("@/shared/lib/api-client/providers").then((m) =>
        m.disconnectOpenAiOAuth(),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["openai-oauth-connection"],
      });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: (model: ModelConfig) => createModel(model),
  });

  const updateModelMutation = useMutation({
    mutationFn: (params: {
      modelName: string;
      modelRoute: ModelConfig["modelRoute"];
      newName?: string;
    }) => updateModel(params.modelName, params.modelRoute, params.newName),
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

  const exportConfigsMutation = useMutation({
    mutationFn: exportConsumerConfigs,
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

  const createProviderMutation = useMutation({
    mutationFn: (input: ProviderInput) => createProvider(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: (params: { name: string; input: ProviderUpdateInput }) =>
      updateProvider(params.name, params.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (name: string) => deleteProvider(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  // Provider form state
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<RegistryProvider | null>(null);
  const [providerFormData, setProviderFormData] = useState<ProviderInput>({
    name: "",
    provider: null,
    baseUrl: null,
    secretRef: "",
  });
  const [providerFormError, setProviderFormError] = useState<string | null>(
    null,
  );
  const providerFormLoading =
    createProviderMutation.isPending || updateProviderMutation.isPending;

  function handleOpenCreateProvider() {
    setEditingProvider(null);
    setProviderFormData({
      name: "",
      provider: null,
      baseUrl: null,
      secretRef: "",
    });
    setProviderFormError(null);
    setProviderFormOpen(true);
  }

  function handleOpenEditProvider(provider: RegistryProvider) {
    setEditingProvider(provider);
    setProviderFormData({
      name: provider.providerName,
      provider: provider.provider,
      baseUrl: provider.baseUrl,
      secretRef: "",
    });
    setProviderFormError(null);
    setProviderFormOpen(true);
  }

  async function handleProviderFormSubmit() {
    setProviderFormError(null);
    try {
      if (editingProvider) {
        await updateProviderMutation.mutateAsync({
          name: editingProvider.providerName,
          input: {
            ...(providerFormData.name !== editingProvider.providerName
              ? { name: providerFormData.name }
              : {}),
            provider: providerFormData.provider,
            baseUrl: providerFormData.baseUrl,
            ...(providerFormData.secretRef
              ? { secretRef: providerFormData.secretRef }
              : {}),
          },
        });
      } else {
        await createProviderMutation.mutateAsync(providerFormData);
      }
      setProviderFormOpen(false);
    } catch (e) {
      setProviderFormError(String(e));
    }
  }

  async function handleDeleteProvider(name: string) {
    try {
      await deleteProviderMutation.mutateAsync(name);
    } catch (e) {
      setProviderFormError(String(e));
    }
  }

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
    handleOpenCreateWithDefaultProvider,
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
    setProviderDefaultProvider(providerQuery.data.defaultProvider);
  }, [providerQuery.data]);

  useEffect(() => {
    if (!oauthDeviceFlow) {
      return;
    }

    const expiresAt = new Date(oauthDeviceFlow.expiresAt).getTime();
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      setOauthDeviceFlow(null);
      setOauthError("O código expirou. Gere um novo para continuar.");
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await pollOpenAiOAuthMutation.mutateAsync({
            deviceAuthId: oauthDeviceFlow.deviceAuthId,
            userCode: oauthDeviceFlow.userCode,
          });

          if (result.status === "approved") {
            setOauthDeviceFlow(null);
            setOauthError(null);
            await queryClient.invalidateQueries({
              queryKey: ["openai-oauth-connection"],
            });
          }
        } catch (error) {
          setOauthError(String(error));
          setOauthDeviceFlow(null);
        }
      })();
    }, Math.max(oauthDeviceFlow.intervalSeconds, 2) * 1000);

    return () => window.clearTimeout(timer);
  }, [oauthDeviceFlow, pollOpenAiOAuthMutation, queryClient]);

  async function handleSubmit() {
    setFormError(null);
    setMutationError(null);

    try {
      const { route, error } = validateAndBuildModelRoute(formData);
      if (error) {
        setFormError(error);
        return;
      }

      if (editingModel) {
        await updateModelMutation.mutateAsync({
          modelName: editingModel.modelName,
          modelRoute: route,
        });
      } else {
        await createModelMutation.mutateAsync({
          modelName: route.modelName,
          modelRoute: route,
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
    providers: providersQuery.data ?? [],
    defaultProvider: defaultProviderQuery.data?.defaultProvider ?? null,
    deleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    setFormError,
    formLoading,
    providerLoading: providerQuery.isLoading,
    providerSaving: updateModelProxyProviderMutation.isPending,
    providerError: providerQuery.error
      ? String(providerQuery.error)
      : updateModelProxyProviderMutation.error
        ? String(updateModelProxyProviderMutation.error)
        : null,
    providerDefaultProvider,
    openAiOAuthConnection:
      openAiOAuthQuery.data ??
      ({
        connected: false,
        accountId: null,
        expiresAt: null,
        baseUrl: "",
      } satisfies OpenAiOAuthConnectionStatus),
    openAiOAuthPending: !!oauthDeviceFlow,
    openAiOAuthDeviceFlow: oauthDeviceFlow,
    openAiOAuthLoading: openAiOAuthQuery.isLoading,
    openAiOAuthBusy:
      startOpenAiOAuthMutation.isPending ||
      pollOpenAiOAuthMutation.isPending ||
      disconnectOpenAiOAuthMutation.isPending,
    openAiOAuthError:
      oauthError ??
      (openAiOAuthQuery.error
        ? String(openAiOAuthQuery.error)
        : startOpenAiOAuthMutation.error
          ? String(startOpenAiOAuthMutation.error)
          : disconnectOpenAiOAuthMutation.error
            ? String(disconnectOpenAiOAuthMutation.error)
            : null),
    handleProviderDefaultProviderChange: async (value: string) => {
      setProviderDefaultProvider(value);
      await updateModelProxyProviderMutation.mutateAsync(value);
    },
    handleStartOpenAiOAuth: async () => {
      setOauthError(null);
      const flow = await startOpenAiOAuthMutation.mutateAsync();
      setOauthDeviceFlow(flow);
    },
    handleCancelOpenAiOAuth: () => {
      setOauthDeviceFlow(null);
    },
    handleDisconnectOpenAiOAuth: async () => {
      setOauthError(null);
      await disconnectOpenAiOAuthMutation.mutateAsync();
      setOauthDeviceFlow(null);
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
    exportingConfigs: exportConfigsMutation.isPending,
    handleExportConfigs: async () => {
      try {
        setMutationError(null);
        await exportConfigsMutation.mutateAsync();
      } catch (e) {
        setMutationError(String(e));
      }
    },
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
    models: mergeRegistryModelsWithConfigAliases(
      modelsQuery.data?.models ?? [],
    ),
    settingsStorage: "database" as const,
    healthChecksByModel: checksByModel,
    getHealthCheck: getCheck,
    healthChecksQuery,
    counts: modelsQuery.data?.counts ?? {
      synced: 0,
      configOnly: 0,
      registryOnly: 0,
      total: 0,
    },
    handleOpenCreateWithDefaultProvider,
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
    providerFormOpen,
    setProviderFormOpen,
    editingProvider,
    providerFormData,
    setProviderFormData,
    providerFormError,
    providerFormLoading,
    handleOpenCreateProvider,
    handleOpenEditProvider,
    handleProviderFormSubmit,
    handleDeleteProvider,
    deleteProviderLoading: deleteProviderMutation.isPending,
  };
}
