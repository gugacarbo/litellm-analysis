import { fetchApi } from "./core";

export interface ModelAliasesResponse {
  aliases: Record<string, string>;
}

export interface PutAliasesRequest {
  aliases: Record<string, string>;
}

export async function getModelAliases(): Promise<ModelAliasesResponse> {
  return fetchApi("/benchmarks/aliases");
}

export async function putModelAliases(
  body: PutAliasesRequest,
): Promise<ModelAliasesResponse> {
  return fetchApi("/benchmarks/aliases", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
