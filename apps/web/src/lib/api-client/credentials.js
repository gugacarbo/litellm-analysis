import { fetchApi } from "./core";
export async function getAllCredentials() {
  return fetchApi("/credentials");
}
export async function getDefaultCredential() {
  return fetchApi("/credentials/default");
}
export async function setDefaultCredential(credentialAlias) {
  return fetchApi("/credentials/default", {
    method: "PUT",
    body: JSON.stringify({ credentialAlias }),
  });
}
