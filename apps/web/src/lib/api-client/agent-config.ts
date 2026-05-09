import type { AgentConfig, CategoryConfig } from "@litellm/shared";
import { fetchApi } from "./core";

type AgentConfigType = "agent" | "category";

export async function getAgentConfig(): Promise<{
  agents: Record<string, AgentConfig>;
  categories: Record<string, CategoryConfig>;
}> {
  return fetchApi("/agent-config");
}

export async function updateAgentConfig(
  key: string,
  type: AgentConfigType,
  config: AgentConfig | CategoryConfig,
  syncAliases: boolean = true,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-config/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, config, syncAliases }),
  });
}

export async function deleteAgentConfig(
  key: string,
  type: AgentConfigType,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-config/${key}?type=${type}`, {
    method: "DELETE",
  });
}

export async function saveAllAgentConfigs(
  agents: Record<string, AgentConfig>,
  categories: Record<string, CategoryConfig>,
): Promise<{ success: boolean }> {
  return fetchApi("/agent-config", {
    method: "PUT",
    body: JSON.stringify({ agents, categories }),
  });
}

export async function getGlobalFallbackModel(): Promise<{
  globalFallbackModel: string;
}> {
  return fetchApi("/agent-config/global-fallback");
}

export async function updateGlobalFallbackModel(
  globalFallbackModel: string,
): Promise<{ success: boolean }> {
  return fetchApi("/agent-config/global-fallback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ globalFallbackModel }),
  });
}

export async function getSyncAliasesConfig(): Promise<{ enabled: boolean }> {
  return fetchApi("/agent-config/sync-aliases");
}

export async function setSyncAliasesConfig(
  enabled: boolean,
): Promise<{ success: boolean }> {
  return fetchApi("/agent-config/sync-aliases", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}
