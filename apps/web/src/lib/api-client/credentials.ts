import { fetchApi } from "./core";

export type LiteLLMCredential = {
  credentialId: string;
  credentialName: string;
  credentialValues: Record<string, unknown> | null;
  credentialInfo: Record<string, unknown> | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type DefaultCredentialResponse = {
  defaultCredential: string | null;
};

export async function getAllCredentials(): Promise<LiteLLMCredential[]> {
  return fetchApi("/credentials");
}

export async function getDefaultCredential(): Promise<DefaultCredentialResponse> {
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
