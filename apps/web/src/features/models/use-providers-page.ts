import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getModelProvider,
  getModelsWithConfig,
  updateModelProvider,
} from "@/shared/lib/api-client";
import {
  type ProviderInput,
  type ProviderUpdateInput,
  createProvider,
  type DiscoveredProviderModel,
  deleteProvider,
  discoverProviderModels,
  discoverOpenAiModels,
  getAllProviders,
  getDefaultProvider,
  getOpenAiOAuthConnectionStatus,
  type OpenAiOAuthConnectionStatus,
  type OpenAiOAuthDeviceCodeStartResult,
  pollOpenAiOAuthDeviceFlow,
  type RegistryProvider,
  registerProviderModels,
  registerOpenAiModels,
  startOpenAiOAuthDeviceFlow,
  testProviderModel,
  testOpenAIModel,
  updateProvider,
} from "@/shared/lib/api-client/providers";

type DiscoverModelsSource =
  | { kind: "openai-oauth" }
  | {
      kind: "provider";
      providerName: string;
      provider: string | null;
    };

export function useProvidersPage() {
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () => getAllProviders(),
  });

  const defaultProviderQuery = useQuery({
    queryKey: ["default-provider"],
    queryFn: () => getDefaultProvider(),
  });

  const providerQuery = useQuery({
    queryKey: ["model-provider", "local-proxy"],
    queryFn: () => getModelProvider("local-proxy"),
  });

  const openAiOAuthQuery = useQuery({
    queryKey: ["openai-oauth-connection"],
    queryFn: () => getOpenAiOAuthConnectionStatus(),
  });

  const modelsWithConfigQuery = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });

  const [providerDefaultProvider, setProviderDefaultProvider] =
    useState("");
  const [oauthDeviceFlow, setOauthDeviceFlow] =
    useState<OpenAiOAuthDeviceCodeStartResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [discoverModelsOpen, setDiscoverModelsOpen] = useState(false);
  const [discoverModelsSource, setDiscoverModelsSource] =
    useState<DiscoverModelsSource | null>(null);
  const [discoverModelsResult, setDiscoverModelsResult] = useState<
    DiscoveredProviderModel[]
  >([]);
  const [discoverModelsError, setDiscoverModelsError] = useState<string | null>(
    null,
  );
  const [testModelId, setTestModelId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState("Say hello in 3 words");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
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
    mutationFn: () => startOpenAiOAuthDeviceFlow(),
  });

  const pollOpenAiOAuthMutation = useMutation({
    mutationFn: (input: { deviceAuthId: string; userCode: string }) =>
      pollOpenAiOAuthDeviceFlow(input),
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

  const discoverOpenAiModelsMutation = useMutation({
    mutationFn: () => discoverOpenAiModels(),
  });
  const discoverProviderModelsMutation = useMutation({
    mutationFn: (providerName: string) =>
      discoverProviderModels(providerName),
  });

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registeredModelIds, setRegisteredModelIds] = useState<string[]>([]);
  const [registerResult, setRegisterResult] = useState<{
    registered: string[];
    skipped: string[];
  } | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const existingModelIds = new Set(
    modelsWithConfigQuery.data?.models.map((model) => model.modelName) ?? [],
  );
  for (const modelId of registeredModelIds) {
    existingModelIds.add(modelId);
  }

  async function handleRegisterModels(modelIds: string[], closeAfter = false) {
    if (!discoverModelsSource) {
      setRegisterError("No discovery source selected.");
      return;
    }

    const modelsToRegister = discoverModelsResult.filter((model) =>
      modelIds.includes(model.id),
    );

    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterResult(null);
    try {
      const result =
        discoverModelsSource.kind === "openai-oauth"
          ? await registerOpenAiModels(modelsToRegister)
          : await registerProviderModels(
              discoverModelsSource.providerName,
              modelsToRegister,
            );
      setRegisterResult((current) => ({
        registered: [
          ...(current?.registered ?? []),
          ...result.registered.filter(
            (modelId) => !(current?.registered ?? []).includes(modelId),
          ),
        ],
        skipped: [
          ...(current?.skipped ?? []),
          ...result.skipped.filter(
            (modelId) => !(current?.skipped ?? []).includes(modelId),
          ),
        ],
      }));
      if (result.registered.length > 0) {
        setRegisteredModelIds((current) => [
          ...current,
          ...result.registered.filter((modelId) => !current.includes(modelId)),
        ]);
      }
      await queryClient.invalidateQueries({
        queryKey: ["models-with-config"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models-sync-diff"],
      });
      if (closeAfter) {
        setDiscoverModelsOpen(false);
      }
    } catch (e) {
      setRegisterError(String(e));
    } finally {
      setRegisterLoading(false);
    }
  }

  const testModelMutation = useMutation({
    mutationFn: (input: { model: string; prompt: string }) =>
      discoverModelsSource?.kind === "provider"
        ? testProviderModel(
            discoverModelsSource.providerName,
            input.model,
            input.prompt,
          )
        : testOpenAIModel(input.model, input.prompt),
    onSuccess: (data) => {
      setTestResult(data.content);
      setTestError(null);
    },
    onError: (error) => {
      setTestError(String(error));
      setTestResult(null);
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
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (name: string) => deleteProvider(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
      await queryClient.invalidateQueries({
        queryKey: ["models-default-settings-diff"],
      });
    },
  });

  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<RegistryProvider | null>(null);
  const [providerFormData, setProviderFormData] = useState<ProviderInput>(
    {
      name: "",
      provider: null,
      baseUrl: null,
      apiKey: "",
    },
  );
  const [providerFormError, setProviderFormError] = useState<string | null>(
    null,
  );
  const providerFormLoading =
    createProviderMutation.isPending || updateProviderMutation.isPending;

  async function handleDiscoverModels() {
    setDiscoverModelsOpen(true);
    setDiscoverModelsSource({ kind: "openai-oauth" });
    setDiscoverModelsResult([]);
    setDiscoverModelsError(null);
    setRegisterError(null);
    setRegisterResult(null);
    setRegisteredModelIds([]);
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

  async function handleDiscoverProviderModels(
    provider: RegistryProvider,
  ) {
    setDiscoverModelsOpen(true);
    setDiscoverModelsSource({
      kind: "provider",
      providerName: provider.providerName,
      provider: provider.provider,
    });
    setDiscoverModelsResult([]);
    setDiscoverModelsError(null);
    setRegisterError(null);
    setRegisterResult(null);
    setRegisteredModelIds([]);
    setTestModelId(null);
    setTestResult(null);
    setTestError(null);
    try {
      const result = await discoverProviderModelsMutation.mutateAsync(
        provider.providerName,
      );
      setDiscoverModelsResult(result.models);
    } catch (e) {
      setDiscoverModelsError(String(e));
    }
  }

  async function handleRegisterAllModels() {
    const modelIds = discoverModelsResult
      .map((m) => m.id)
      .filter((modelId) => !existingModelIds.has(modelId));
    if (modelIds.length === 0) return;
    await handleRegisterModels(modelIds, true);
  }

  async function handleRegisterSingleModel(modelId: string) {
    if (existingModelIds.has(modelId)) {
      return;
    }

    await handleRegisterModels([modelId]);
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

  function handleOpenCreateProvider() {
    setEditingProvider(null);
    setProviderFormData({
      name: "",
      provider: null,
      baseUrl: null,
      apiKey: "",
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
      apiKey: "",
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
            ...(providerFormData.apiKey
              ? { apiKey: providerFormData.apiKey }
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

  return {
    providers: providersQuery.data ?? [],
    defaultProvider: defaultProviderQuery.data?.defaultProvider ?? null,
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
    discoverModelsOpen,
    setDiscoverModelsOpen,
    discoverModelsSource,
    discoverModelsResult,
    discoverModelsLoading:
      discoverOpenAiModelsMutation.isPending ||
      discoverProviderModelsMutation.isPending,
    discoverModelsError,
    handleDiscoverModels,
    handleDiscoverProviderModels,
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
    handleRegisterSingleModel,
    existingModelIds,
  };
}
