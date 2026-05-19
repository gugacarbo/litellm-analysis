import type {
  PluginConfigResponse,
  PluginInfo,
  PluginRouting,
} from "@lite-llm/contracts/agent-catalog";
import { fetchApi } from "./core";

export async function getPluginRouting(): Promise<
  Record<string, PluginRouting>
> {
  return fetchApi("/plugin-routing");
}

export async function getAvailablePlugins(): Promise<PluginInfo[]> {
  return fetchApi("/plugin-routing/plugins");
}

export async function getPluginConfig(
  pluginId: string,
): Promise<PluginConfigResponse> {
  return fetchApi(`/plugin-routing/${pluginId}/config`);
}

export async function savePluginConfig(
  pluginId: string,
  data: {
    config?: Record<string, unknown>;
    agentMappings?: Record<string, string>;
    categoryMappings?: Record<string, boolean>;
  },
): Promise<{ success: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/config`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function toggleCategoryExport(
  pluginId: string,
  categoryId: string,
): Promise<{ categoryId: string; enabled: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/categories/${categoryId}`, {
    method: "PATCH",
  });
}

export async function savePluginRouting(
  config: Record<string, PluginRouting>,
): Promise<{ success: boolean }> {
  return fetchApi("/plugin-routing", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

export async function getPluginSchema(
  pluginId: string,
): Promise<{ schema: Record<string, unknown> }> {
  return fetchApi(`/plugin-routing/${pluginId}/schema`);
}
