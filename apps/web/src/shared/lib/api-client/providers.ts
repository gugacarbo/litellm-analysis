import { fetchApi } from "./core";

export type RegistryProvider = {
  providerId: string;
  providerName: string;
  isDefault: boolean;
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

export async function getAllProviders(): Promise<RegistryProvider[]> {
  return fetchApi("/providers");
}

export async function getDefaultProvider(): Promise<{
  defaultProvider: string | null;
}> {
  return fetchApi("/providers/default");
}

export async function getOpenAiOAuthConnectionStatus(): Promise<OpenAiOAuthConnectionStatus> {
  return fetchApi("/providers/openai-oauth");
}
