import type { PluginInfoDTO } from "@lite-llm/api-contracts/agent-catalog";
import { fetchApi } from "./core";

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
