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
  RegistryCredential,
} from "@/shared/lib/api-client/credentials";
import {
  type CredentialInput,
  type CredentialUpdateInput,
  createCredential,
  deleteCredential,
  updateCredential,
} from "@/shared/lib/api-client/credentials";
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
    queryKey: ["model-provider", "local-proxy"],
    queryFn: () => getModelProvider("local-proxy"),
  });

  const openAiOAuthQuery = useQuery({
    queryKey: ["openai-oauth-connection"],
    queryFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.getOpenAiOAuthConnectionStatus(),
      ),
  });

  const [providerDefaultCredential, setProviderDefaultCredential] =
    useState("");
  const [oauthDeviceFlow, setOauthDeviceFlow] =
    useState<OpenAiOAuthDeviceCodeStartResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const updateProviderMutation = useMutation({
    mutationFn: (defaultCredential: string) =>
      updateModelProvider("local-proxy", { defaultCredential }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["model-provider", "local-proxy"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["default-credential"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

  const startOpenAiOAuthMutation = useMutation({
    mutationFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.startOpenAiOAuthDeviceFlow(),
      ),
  });

  const pollOpenAiOAuthMutation = useMutation({
    mutationFn: (input: { deviceAuthId: string; userCode: string }) =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.pollOpenAiOAuthDeviceFlow(input),
      ),
  });

  const disconnectOpenAiOAuthMutation = useMutation({
    mutationFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
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

  const createCredentialMutation = useMutation({
    mutationFn: (input: CredentialInput) => createCredential(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: (params: { name: string; input: CredentialUpdateInput }) =>
      updateCredential(params.name, params.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (name: string) => deleteCredential(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });

  // Credential form state
  const [credentialFormOpen, setCredentialFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<RegistryCredential | null>(null);
  const [credentialFormData, setCredentialFormData] = useState<CredentialInput>(
    {
      name: "",
      provider: null,
      baseUrl: null,
      secretRef: "",
    },
  );
  const [credentialFormError, setCredentialFormError] = useState<string | null>(
    null,
  );
  const credentialFormLoading =
    createCredentialMutation.isPending || updateCredentialMutation.isPending;

  function handleOpenCreateCredential() {
    setEditingCredential(null);
    setCredentialFormData({
      name: "",
      provider: null,
      baseUrl: null,
      secretRef: "",
    });
    setCredentialFormError(null);
    setCredentialFormOpen(true);
  }

  function handleOpenEditCredential(credential: RegistryCredential) {
    setEditingCredential(credential);
    setCredentialFormData({
      name: credential.credentialName,
      provider: credential.provider,
      baseUrl: credential.baseUrl,
      secretRef: credential.secretRef ?? "",
    });
    setCredentialFormError(null);
    setCredentialFormOpen(true);
  }

  async function handleCredentialFormSubmit() {
    setCredentialFormError(null);
    try {
      if (editingCredential) {
        await updateCredentialMutation.mutateAsync({
          name: editingCredential.credentialName,
          input: {
            ...(credentialFormData.name !== editingCredential.credentialName
              ? { name: credentialFormData.name }
              : {}),
            provider: credentialFormData.provider,
            baseUrl: credentialFormData.baseUrl,
            ...(credentialFormData.secretRef
              ? { secretRef: credentialFormData.secretRef }
              : {}),
          },
        });
      } else {
        await createCredentialMutation.mutateAsync(credentialFormData);
      }
      setCredentialFormOpen(false);
    } catch (e) {
      setCredentialFormError(String(e));
    }
  }

  async function handleDeleteCredential(name: string) {
    try {
      await deleteCredentialMutation.mutateAsync(name);
    } catch (e) {
      setCredentialFormError(String(e));
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
    handleProviderDefaultCredentialChange: async (value: string) => {
      setProviderDefaultCredential(value);
      await updateProviderMutation.mutateAsync(value);
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
    models: modelsQuery.data?.models ?? [],
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
    credentialFormOpen,
    setCredentialFormOpen,
    editingCredential,
    credentialFormData,
    setCredentialFormData,
    credentialFormError,
    credentialFormLoading,
    handleOpenCreateCredential,
    handleOpenEditCredential,
    handleCredentialFormSubmit,
    handleDeleteCredential,
    deleteCredentialLoading: deleteCredentialMutation.isPending,
  };
}
