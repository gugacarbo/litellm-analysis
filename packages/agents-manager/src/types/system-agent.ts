// ── System Agent Types ──
// Generic agent definition types for the agents-manager architecture.
// Not coupled to any specific plugin or runtime.

export interface AgentVersion {
  id: string;
  displayName: string;
  modelIdStrategy: "model-name" | "prefix-version";
  limits: {
    context: number;
    output: number;
  };
  cost?: {
    input: number;
    output: number;
  };
}

export interface AgentExtraConfig {
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
}

export interface SystemAgent {
  id: string;
  displayName: string;
  icon: string;
  description: string;
  versions: AgentVersion[];
  model: string;
  fallbackModels: string[];
  enabledPlugins: string[];
  config: AgentExtraConfig;
}
