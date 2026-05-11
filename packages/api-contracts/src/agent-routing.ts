import type { SystemAgent } from "@litellm/shared";

export type { SystemAgent };

export interface AgentCatalogResponse {
  agents: SystemAgent[];
}

export interface AgentCatalogDetailResponse {
  agent: SystemAgent;
}
