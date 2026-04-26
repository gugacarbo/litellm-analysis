import { fetchApi } from "./core";

export type AgentRoutingAPIResponse = {
  [model: string]: string;
};

export async function getAgentRoutingConfig(): Promise<AgentRoutingAPIResponse> {
  const data = await fetchApi<unknown>("/agent-routing");
  if (typeof data === "object" && data && "model_group_alias" in data) {
    return (data as { model_group_alias: AgentRoutingAPIResponse })
      .model_group_alias;
  }
  return data as AgentRoutingAPIResponse;
}

export async function updateAgentRoutingConfig(
  modelGroupAlias: AgentRoutingAPIResponse,
): Promise<{ success: boolean }> {
  return fetchApi("/agent-routing", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model_group_alias: modelGroupAlias }),
  });
}
