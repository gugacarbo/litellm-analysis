import type {
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "@litellm/shared";

export type { PluginRoutingConfig, PluginRoutingRule, SystemAgent };

export interface InternalAgent {
  id: string;
  displayName: string;
  description: string;
}

export interface ConfigField {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "password";
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
}

export interface PluginRoutingResponse {
  config: PluginRoutingConfig;
  plugins: PluginInfo[];
}

export interface PluginToggleResponse {
  pluginId: string;
  agentId: string;
  enabled: boolean;
}
