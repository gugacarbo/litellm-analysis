import type { AgentDefinitionsResponse } from "@lite-llm/api-contracts/agent-routing";
import { fetchApi } from "./core";

export async function getAgentDefinitions(): Promise<AgentDefinitionsResponse> {
  return fetchApi("/agent-definitions");
}
