import type { AgentExtraConfig, SystemAgent } from "@lite-llm/agent-schemas";

export type { SystemAgent };

// Agent entry with catalog key for API responses
export interface AgentCatalogEntry {
  key: string;
  displayName: string;
  icon: string;
  description: string;
  limits: { context: number; output: number };
  model: string;
  config: AgentExtraConfig;
}

export interface AgentCatalogResponse {
  agents: AgentCatalogEntry[];
}

export interface AgentCatalogDetailResponse {
  key: string;
  agent: SystemAgent;
}
