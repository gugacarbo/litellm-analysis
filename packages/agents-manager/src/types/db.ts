// ── Database types ──

export interface DbModelSpec {
  displayName: string;
  ownedBy?: string;
  family?: string;
  contextLength: number;
  maxOutput: number;
  cost?: {
    input?: number;
    output?: number;
  };
}

export interface DbAgentEntry {
  model: string;
  fallbackModels?: string[];
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
  mode?: 'subagent' | 'primary' | 'all';
  permission?: {
    edit?: 'ask' | 'allow' | 'deny';
    bash?: 'ask' | 'allow' | 'deny' | Record<string, 'ask' | 'allow' | 'deny'>;
    webfetch?: 'ask' | 'allow' | 'deny';
    doom_loop?: 'ask' | 'allow' | 'deny';
    external_directory?: 'ask' | 'allow' | 'deny';
  };
}

export interface DbCategoryEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: {
    type: 'enabled' | 'disabled';
    budgetTokens?: number;
  };
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
  textVerbosity?: 'low' | 'medium' | 'high';
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
}

export interface DbConfig {
  $schema?: string;
  version: number;
  litellm: {
    baseUrl: string;
    apiKey: string;
  };
  models: Record<string, DbModelSpec>;
  agents: Record<string, DbAgentEntry>;
  categories: Record<string, DbCategoryEntry>;
  globalFallbackModel?: string;
}
