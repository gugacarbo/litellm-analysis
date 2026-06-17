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
