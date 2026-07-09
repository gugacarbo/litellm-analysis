export interface InternalAgent {
  id: string;
  displayName: string;
  description: string;
}

export interface ConfigField {
  key: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "password"
    | "multiselect"
    | "switch-group";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}

export interface PluginInfo {
  id: string;
  name: string;
  enabled: boolean;
  outputFile: string;
  internalAgents: InternalAgent[];
  configSchema: ConfigField[];
  agentCount: number;
  enabledAgentCount: number;
}

export interface PluginConfigResponse {
  config: Record<string, unknown>;
  agentMappings: Record<string, string>;
  categoryMappings: Record<string, boolean>;
  schema: ConfigField[];
  internalAgents: InternalAgent[];
  allModels: Record<string, unknown>;
  litellmProvider: { baseUrl: string; name: string };
}

export interface PluginRouting {
  enabled?: boolean;
  outputFile?: string;
  config?: Record<string, unknown>;
  routing?: {
    agents?: Record<string, string | string[]>;
    categories?: Record<string, boolean>;
  };
}

export type PluginSchemaResponse = {
  schema: Record<string, unknown>;
};

export type PluginToggleResponse = {
  pluginId: string;
  agentId: string;
  enabled: boolean;
};
