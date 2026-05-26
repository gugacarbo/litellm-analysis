export interface PluginRouting {
  enabled?: boolean;
  outputFile?: string;
  config?: Record<string, unknown>;
  routing?: {
    agents?: Record<string, string | string[]>;
    categories?: Record<string, boolean>;
  };
}

export interface AgentConfig {
  mode?: string;
  tools?: Record<string, unknown>;
  color?: string;
  temperature?: number;
  [key: string]: unknown;
}

export interface SystemAgent {
  id?: string;
  displayName?: string;
  icon?: string;
  description?: string;
  limits?: {
    context?: number;
    output?: number;
    [key: string]: unknown;
  };
  model?: string;
  config?: AgentConfig;
  [key: string]: unknown;
}

export interface CategoryEntry {
  description?: string;
  model?: string;
  temperature?: number;
  limits?: {
    context?: number;
    output?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DbConfig {
  globalFallbackModel?: string;
  agents?: Record<string, SystemAgent>;
  categories?: Record<string, CategoryEntry>;
  plugins?: Record<string, PluginRouting>;
  [key: string]: unknown;
}

export interface AgentsRepositoryLike {
  read(): Promise<DbConfig>;
  write(config: DbConfig): Promise<void>;
}
