import { fetchApi } from "./core";

export type RegistryProvider = {
  providerId: string;
  providerName: string;
  provider: string | null;
  baseUrl: string | null;
  hasStoredSecret: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OpenAiOAuthConnectionStatus = {
  connected: boolean;
  accountId: string | null;
  expiresAt: string | null;
  baseUrl: string;
};

export type OpenAiOAuthDeviceCodeStartResult = {
  deviceAuthId: string;
  userCode: string;
  verificationUri: string;
  intervalSeconds: number;
  expiresAt: string;
};

export type OpenAiOAuthDeviceCodePollResult =
  | {
      status: "pending";
      intervalSeconds: number;
    }
  | {
      status: "approved";
      connection: OpenAiOAuthConnectionStatus;
    };

export type ProviderInput = {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey: string;
  secretRef?: string | null;
};

export type ProviderUpdateInput = {
  name?: string;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string;
  secretRef?: string | null;
};

export async function getProvider(
  name: string,
): Promise<RegistryProvider | null> {
  return fetchApi(`/providers/${encodeURIComponent(name)}`);
}

export async function createProvider(
  input: ProviderInput,
): Promise<RegistryProvider> {
  return fetchApi("/providers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProvider(
  name: string,
  input: ProviderUpdateInput,
): Promise<RegistryProvider> {
  return fetchApi(`/providers/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteProvider(
  name: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/providers/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export async function getAllProviders(): Promise<RegistryProvider[]> {
  return fetchApi("/providers");
}

export async function getDefaultProvider(): Promise<{
  defaultProvider: string | null;
}> {
  return fetchApi("/providers/default");
}

export async function setDefaultProvider(
  providerAlias: string | null,
): Promise<{ success: boolean }> {
  return fetchApi("/providers/default", {
    method: "PUT",
    body: JSON.stringify({ providerAlias }),
  });
}

export async function getOpenAiOAuthConnectionStatus(): Promise<OpenAiOAuthConnectionStatus> {
  return fetchApi("/providers/openai-oauth");
}

export async function startOpenAiOAuthDeviceFlow(): Promise<OpenAiOAuthDeviceCodeStartResult> {
  return fetchApi("/providers/openai-oauth/device/start", {
    method: "POST",
  });
}

export async function pollOpenAiOAuthDeviceFlow(input: {
  deviceAuthId: string;
  userCode: string;
}): Promise<OpenAiOAuthDeviceCodePollResult> {
  return fetchApi("/providers/openai-oauth/device/poll", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function disconnectOpenAiOAuth(): Promise<{ success: boolean }> {
  return fetchApi("/providers/openai-oauth", {
    method: "DELETE",
  });
}

export type OpenAiDiscoveredModel = {
  id: string;
  ownedBy: string;
  object?: string;
  created?: number;
};

export type DiscoveredProviderModel = OpenAiDiscoveredModel;

export async function discoverOpenAiModels(): Promise<{
  models: OpenAiDiscoveredModel[];
}> {
  return fetchApi("/providers/openai-oauth/discover-models");
}

export async function discoverProviderModels(name: string): Promise<{
  models: DiscoveredProviderModel[];
}> {
  return fetchApi(`/providers/${encodeURIComponent(name)}/discover-models`);
}

export async function testOpenAIModel(
  model: string,
  prompt: string,
): Promise<{
  content: string;
}> {
  return fetchApi("/providers/openai-oauth/test-chat", {
    method: "POST",
    body: JSON.stringify({ model, prompt }),
  });
}

export async function testProviderModel(
  name: string,
  model: string,
  prompt: string,
): Promise<{
  content: string;
}> {
  return fetchApi(`/providers/${encodeURIComponent(name)}/test-chat`, {
    method: "POST",
    body: JSON.stringify({ model, prompt }),
  });
}

export async function registerOpenAiModels(
  models: DiscoveredProviderModel[],
): Promise<{ registered: string[]; skipped: string[]; errors: string[] }> {
  return fetchApi("/providers/openai-oauth/register-models", {
    method: "POST",
    body: JSON.stringify({ models }),
  });
}

export async function registerProviderModels(
  name: string,
  models: DiscoveredProviderModel[],
): Promise<{ registered: string[]; skipped: string[]; errors: string[] }> {
  return fetchApi(`/providers/${encodeURIComponent(name)}/register-models`, {
    method: "POST",
    body: JSON.stringify({ models }),
  });
}
