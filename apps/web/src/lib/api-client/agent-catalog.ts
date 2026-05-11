import type {
  AgentCatalogDetailResponse,
  AgentCatalogResponse,
  SystemAgent,
} from "@lite-llm/api-contracts/agent-routing";
import type { CategoryEntry } from "@lite-llm/api-contracts/category";
import { fetchApi } from "./core";

export async function getAgentCatalog(): Promise<AgentCatalogResponse> {
  return fetchApi("/agent-catalog");
}

export async function getSystemAgent(
  id: string,
): Promise<AgentCatalogDetailResponse> {
  return fetchApi(`/agent-catalog/${id}`);
}

export async function upsertSystemAgent(
  id: string,
  agent: SystemAgent,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-catalog/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
}

export async function deleteSystemAgent(
  id: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-catalog/${id}`, {
    method: "DELETE",
  });
}

export async function getCategoryCatalog(): Promise<
  Record<string, CategoryEntry>
> {
  return fetchApi("/category-catalog");
}

export async function upsertCategory(
  key: string,
  entry: CategoryEntry,
): Promise<{ success: boolean }> {
  return fetchApi(`/category-catalog/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export async function deleteCategory(
  key: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/category-catalog/${key}`, {
    method: "DELETE",
  });
}
