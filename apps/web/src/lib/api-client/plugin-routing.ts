import type {
  PluginInfo,
  PluginRoutingResponse,
} from "@lite-llm/api-contracts/agent-catalog";
import { fetchApi } from "./core";

export async function getPluginRouting(): Promise<PluginRoutingResponse> {
  return fetchApi("/plugin-routing");
}

export async function getAvailablePlugins(): Promise<PluginInfo[]> {
  return fetchApi("/plugin-routing/plugins");
}

export async function toggleAgentPlugin(
  pluginId: string,
  agentId: string,
): Promise<{ pluginId: string; agentId: string; enabled: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/agents/${agentId}`, {
    method: "PATCH",
  });
}
