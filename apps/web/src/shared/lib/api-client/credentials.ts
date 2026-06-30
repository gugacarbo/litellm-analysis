import { fetchApi } from "./core";

export type RegistryCredential = {
  credentialId: string;
  credentialName: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
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

/** @deprecated Use RegistryCredential */
export type LiteLLMCredential = RegistryCredential;

export async function getAllCredentials(): Promise<RegistryCredential[]> {
  return fetchApi("/credentials");
}

export async function getDefaultCredential(): Promise<{
  defaultCredential: string | null;
}> {
  return fetchApi("/credentials/default");
}

export async function setDefaultCredential(
  credentialAlias: string | null,
): Promise<{ success: boolean }> {
  return fetchApi("/credentials/default", {
    method: "PUT",
    body: JSON.stringify({ credentialAlias }),
  });
}

export async function getOpenAiOAuthConnectionStatus(): Promise<OpenAiOAuthConnectionStatus> {
  return fetchApi("/credentials/openai-oauth");
}

export async function startOpenAiOAuthDeviceFlow(): Promise<OpenAiOAuthDeviceCodeStartResult> {
  return fetchApi("/credentials/openai-oauth/device/start", {
    method: "POST",
  });
}

export async function pollOpenAiOAuthDeviceFlow(input: {
  deviceAuthId: string;
  userCode: string;
}): Promise<OpenAiOAuthDeviceCodePollResult> {
  return fetchApi("/credentials/openai-oauth/device/poll", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function disconnectOpenAiOAuth(): Promise<{ success: boolean }> {
  return fetchApi("/credentials/openai-oauth", {
    method: "DELETE",
  });
}
