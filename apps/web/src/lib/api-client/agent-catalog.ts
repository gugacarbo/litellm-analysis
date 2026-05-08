import type { SystemAgentDTO } from "@lite-llm/api-contracts/agent-catalog";
import { fetchApi } from "./core";

export interface CreateSystemAgentDTO {
  displayName: string;
  icon: string;
  description: string;
  versions: { name: string; model: string; enabled: boolean }[];
  model: string;
  fallbackModels?: string[];
  enabledPlugins?: string[];
  mode?: string;
  color?: string;
  disable?: boolean;
}

export async function getAgentCatalog(): Promise<SystemAgentDTO[]> {
  return fetchApi("/agent-catalog");
}

export async function getAgentCatalogItem(id: string): Promise<SystemAgentDTO> {
  return fetchApi(`/agent-catalog/${id}`);
}

export async function createAgentCatalogItem(
  data: CreateSystemAgentDTO,
): Promise<{ key: string }> {
  return fetchApi("/agent-catalog", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAgentCatalogItem(
  id: string,
  data: Partial<SystemAgentDTO>,
): Promise<SystemAgentDTO> {
  return fetchApi(`/agent-catalog/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAgentCatalogItem(
  id: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-catalog/${id}`, {
    method: "DELETE",
  });
}
