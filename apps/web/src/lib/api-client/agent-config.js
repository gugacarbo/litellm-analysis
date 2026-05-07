import { fetchApi } from "./core";
export async function getAgentConfig() {
  return fetchApi("/agent-config");
}
export async function getAgentConfigByKey(key) {
  return fetchApi(`/agent-config/${key}`);
}
export async function updateAgentConfig(key, type, config, syncAliases = true) {
  return fetchApi(`/agent-config/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, config, syncAliases }),
  });
}
export async function deleteAgentConfig(key, type) {
  return fetchApi(`/agent-config/${key}?type=${type}`, {
    method: "DELETE",
  });
}
export async function saveAllAgentConfigs(agents, categories) {
  return fetchApi("/agent-config", {
    method: "PUT",
    body: JSON.stringify({ agents, categories }),
  });
}
export async function getGlobalFallbackModel() {
  return fetchApi("/agent-config/global-fallback");
}
export async function updateGlobalFallbackModel(globalFallbackModel) {
  return fetchApi("/agent-config/global-fallback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ globalFallbackModel }),
  });
}
