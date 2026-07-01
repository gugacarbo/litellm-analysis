import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getDefaultSettingsDiff,
  getModelProvider,
  syncDefaultSettings,
  updateModelProvider,
} from "@/shared/lib/api-client";
import {
  type CredentialInput,
  type CredentialUpdateInput,
  createCredential,
  deleteCredential,
  discoverOpenAiModels,
  getAllCredentials,
  getDefaultCredential,
  getOpenAiOAuthConnectionStatus,
  type OpenAiOAuthConnectionStatus,
  type OpenAiOAuthDeviceCodeStartResult,
  pollOpenAiOAuthDeviceFlow,
  type RegistryCredential,
  registerOpenAiModels,
  startOpenAiOAuthDeviceFlow,
  testOpenAIModel,
  updateCredential,
} from "@/shared/lib/api-client/credentials";

export function useCredentialsPage() {
  const queryClient = useQueryClient();

  const credentialsQuery = useQuery({
    queryKey: ["credentials"],
    queryFn: () => getAllCredentials(),
  });

  const defaultCredentialQuery = useQuery({
    queryKey: ["default-credential"],
    queryFn: () => getDefaultCredential(),
  });

  const providerQuery = useQuery({
    queryKey: ["model-provider", "local-proxy"],
    queryFn: () => getModelProvider("local-proxy"),
  });

  const openAiOAuthQuery = useQuery({
    queryKey: ["openai-oauth-connection"],
    queryFn: () => getOpenAiOAuthConnectionStatus(),
  });

  const defaultSettingsDiffQuery = useQuery({
    queryKey: ["models-default-settings-diff"],
    queryFn: getDefaultSettingsDiff,
  });

  const [providerDefaultCredential, setProviderDefaultCredential] =
    useState("");
  const [oauthDeviceFlow, setOauthDeviceFlow] =
    useState<OpenAiOAuthDeviceCodeStartResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [discoverModelsOpen, setDiscoverModelsOpen] = useState(false);
  const [discoverModelsResult, setDiscoverModelsResult] = useState<
    { id: string; ownedBy: string }[]
  >([]);
  const [discoverModelsError, setDiscoverModelsError] = useState<string | null>(
    null,
  );
  const [testModelId, setTestModelId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState("Say hello in 3 words");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
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
    mutationFn: () => startOpenAiOAuthDeviceFlow(),
  });

  const pollOpenAiOAuthMutation = useMutation({
    mutationFn: (input: { deviceAuthId: string; userCode: string }) =>
      pollOpenAiOAuthDeviceFlow(input),
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

  const discoverOpenAiModelsMutation = useMutation({
    mutationFn: () => discoverOpenAiModels(),
  });

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerResult, setRegisterResult] = useState<{
    registered: string[];
    skipped: string[];
  } | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  async function handleRegisterModels(modelIds: string[]) {
    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterResult(null);
    try {
      const result = await registerOpenAiModels(modelIds);
      setRegisterResult(result);
      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models-sync-diff"],
      });
    } catch (e) {
      setRegisterError(String(e));
    } finally {
      setRegisterLoading(false);
    }
  }

  const testModelMutation = useMutation({
    mutationFn: (input: { model: string; prompt: string }) =>
      testOpenAIModel(input.model, input.prompt),
    onSuccess: (data) => {
      setTestResult(data.content);
      setTestError(null);
    },
    onError: (error) => {
      setTestError(String(error));
      setTestResult(null);
    },
  });

  const syncDefaultSettingsMutation = useMutation({
    mutationFn: syncDefaultSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
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
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (name: string) => deleteCredential(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credentials"] });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

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

  async function handleDiscoverModels() {
    setDiscoverModelsOpen(true);
    setDiscoverModelsResult([]);
    setDiscoverModelsError(null);
    setTestModelId(null);
    setTestResult(null);
    setTestError(null);
    try {
      const result = await discoverOpenAiModelsMutation.mutateAsync();
      setDiscoverModelsResult(result.models);
    } catch (e) {
      setDiscoverModelsError(String(e));
    }
  }

  async function handleRegisterAllModels() {
    const modelIds = discoverModelsResult.map((m) => m.id);
    if (modelIds.length === 0) return;
    await handleRegisterModels(modelIds);
    setDiscoverModelsOpen(false);
  }

  function handleTestModel(modelId: string) {
    setTestModelId(modelId);
    setTestResult(null);
    setTestError(null);
    void testModelMutation
      .mutateAsync({ model: modelId, prompt: testPrompt })
      .catch(() => {});
  }

  async function handleRunTest() {
    if (!testModelId) return;
    setTestResult(null);
    setTestError(null);
    try {
      const result = await testModelMutation.mutateAsync({
        model: testModelId,
        prompt: testPrompt,
      });
      setTestResult(result.content);
    } catch (e) {
      setTestError(String(e));
    }
  }

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

  return {
    credentials: credentialsQuery.data ?? [],
    defaultCredential: defaultCredentialQuery.data?.defaultCredential ?? null,
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
    defaultSettingsDriftCount: defaultSettingsDiffQuery.data?.count ?? 0,
    defaultSettingsMismatchedModels:
      defaultSettingsDiffQuery.data?.mismatchedModels ?? [],
    defaultSettingsLoading: defaultSettingsDiffQuery.isLoading,
    syncingDefaultSettings: syncDefaultSettingsMutation.isPending,
    handleSyncDefaultSettings: async () => {
      try {
        await syncDefaultSettingsMutation.mutateAsync();
      } catch (e) {
        setOauthError(String(e));
      }
    },
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
    discoverModelsOpen,
    setDiscoverModelsOpen,
    discoverModelsResult,
    discoverModelsLoading: discoverOpenAiModelsMutation.isPending,
    discoverModelsError,
    handleDiscoverModels,
    testModelId,
    testPrompt,
    setTestPrompt,
    testResult,
    testError,
    testLoading: testModelMutation.isPending,
    handleTestModel,
    handleRunTest,
    registerModelsLoading: registerLoading,
    registerModelsResult: registerResult,
    registerModelsError: registerError,
    handleRegisterModels: handleRegisterAllModels,
  };
}
