import type { AgentExtraConfig } from "@lite-llm/agents-repository/schemas";

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
