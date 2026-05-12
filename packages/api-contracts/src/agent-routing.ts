import type { SystemAgent } from "@litellm/shared";

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
  enabledPlugins: string[];
  config: {
    mode?: "subagent" | "primary" | "all";
    tools?: Record<string, boolean>;
    permissions?: Record<string, unknown>;
    color?: string;
    disable?: boolean;
    variant?: string;
    category?: string;
    skills?: string[];
    temperature?: number;
    topP?: number;
    prompt?: string;
    promptAppend?: string;
  };
}

export interface AgentCatalogResponse {
  agents: AgentCatalogEntry[];
}

export interface AgentCatalogDetailResponse {
  key: string;
  agent: SystemAgent;
}
