import type { SystemAgent } from "@litellm/shared";
import type { AgentExtraConfig } from "@litellm/shared";
 
 export type { SystemAgent };
 
 // Agent entry with catalog key for API responses
 export interface AgentCatalogEntry {
   key: string;
   displayName: string;
   icon: string;
   description: string;
   limits: { context: number; output: number };
   model: string;
   fallbackModels: string[];
   config: AgentExtraConfig;
 }

export interface AgentCatalogResponse {
  agents: AgentCatalogEntry[];
}

export interface AgentCatalogDetailResponse {
  key: string;
  agent: SystemAgent;
}
