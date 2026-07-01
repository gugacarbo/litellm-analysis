import { fetchApi } from "./core";

export type ManualModelAliasEntry = {
  alias: string;
  targetModel: string;
};

export async function getAllModelAliases(): Promise<{
  aliases: ManualModelAliasEntry[];
}> {
  return fetchApi("/models/aliases");
}

export async function getModelAliases(modelName: string): Promise<{
  modelName: string;
  aliases: string[];
}> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}/aliases`);
}

export async function updateModelAliases(
  modelName: string,
  aliases: string[],
): Promise<{
  aliases: ManualModelAliasEntry[];
}> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}/aliases`, {
    method: "PUT",
    body: JSON.stringify({ aliases }),
  });
}

export async function deleteModelAlias(
  alias: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/models/aliases/${encodeURIComponent(alias)}`, {
    method: "DELETE",
  });
}
