// ── API/Config file types ──

export interface AgentConfig {
  model?: string;
  fallback_models?: string[];
  description?: string;
  color?: string;
  disable?: boolean;
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  mode?: "subagent" | "primary" | "all";
  permission?: {
    edit?: "ask" | "allow" | "deny";
    bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">;
    webfetch?: "ask" | "allow" | "deny";
    doom_loop?: "ask" | "allow" | "deny";
    external_directory?: "ask" | "allow" | "deny";
  };
  [key: string]: unknown;
}

export interface CategoryConfig {
  model?: string;
  fallback_models?: string[];
  description?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: {
    type: "enabled" | "disabled";
    budgetTokens?: number;
  };
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
  [key: string]: unknown;
}

export interface AgentConfigFile {
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  globalFallbackModel?: string;
}
