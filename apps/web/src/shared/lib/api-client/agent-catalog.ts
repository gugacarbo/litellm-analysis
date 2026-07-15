import type {
  AgentCatalogDetailResponse,
  AgentCatalogResponse,
} from "@lite-llm/contracts/agent-routing";
import type { CategoryEntry } from "@lite-llm/contracts/category";
import { fetchApi } from "./core";

export interface SystemAgentOption {
  key: string;
  displayName: string;
}

export async function getAgentCatalog(): Promise<AgentCatalogResponse> {
  return fetchApi("/agent-catalog");
}

export async function getSystemAgent(
  id: string,
): Promise<AgentCatalogDetailResponse> {
  return fetchApi(`/agent-catalog/${id}`);
}

export async function getCategoryCatalog(): Promise<
  Record<string, CategoryEntry>
> {
  return fetchApi("/category-catalog");
}
