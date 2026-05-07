import { fetchApi } from "./core";
export async function getAgentRoutingConfig() {
  const data = await fetchApi("/agent-routing");
  if (typeof data === "object" && data && "model_group_alias" in data) {
    return data.model_group_alias;
  }
  return data;
}
export async function updateAgentRoutingConfig(modelGroupAlias) {
  return fetchApi("/agent-routing", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model_group_alias: modelGroupAlias }),
  });
}
