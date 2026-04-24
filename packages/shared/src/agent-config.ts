export interface AgentConfig {
  model?: string;
  fallback_models?: string[];
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  disable?: boolean;
  description?: string;
  mode?: 'subagent' | 'primary' | 'all';
  color?: string;
  permission?: {
    edit?: 'ask' | 'allow' | 'deny';
    bash?: 'ask' | 'allow' | 'deny' | Record<string, 'ask' | 'allow' | 'deny'>;
    webfetch?: 'ask' | 'allow' | 'deny';
    doom_loop?: 'ask' | 'allow' | 'deny';
    external_directory?: 'ask' | 'allow' | 'deny';
  };
}

export interface CategoryConfig {
  model?: string;
  fallback_models?: string[];
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
  description?: string;
}

export interface OhMyOpenAgentConfig {
  $schema?: string;
  agents: Record<string, AgentConfig>;
  categories: Record<string, CategoryConfig>;
  git_master?: {
    commit_footer?: boolean;
    include_co_authored_by?: boolean;
  };
}

export interface AgentConfigFile {
  agents: Record<string, AgentConfig>;
  categories: Record<string, CategoryConfig>;
}
