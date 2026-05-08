import type {
  PluginInfoDTO,
  PluginRoutingDTO,
} from "@lite-llm/api-contracts/agent-catalog";
import { fetchApi } from "./core";

export async function getPluginRouting(): Promise<PluginRoutingDTO> {
  return fetchApi("/plugin-routing");
}

export async function updatePluginRouting(
  config: PluginRoutingDTO,
): Promise<PluginRoutingDTO> {
  return fetchApi("/plugin-routing", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

export async function toggleAgentPlugin(
  pluginId: string,
  agentId: string,
): Promise<{ enabled: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/agents/${agentId}`, {
    method: "PATCH",
  });
}

export async function getAvailablePlugins(): Promise<PluginInfoDTO[]> {
  return fetchApi("/plugin-routing/plugins");
}
