import { fetchApi } from "./core";
export async function getAgentDefinitions() {
  return fetchApi("/agent-definitions");
}
