import type {
  PluginRouting,
  PluginRoutingRule,
  SystemAgent,
} from "@litellm/shared";

export type { PluginRouting, PluginRoutingRule, SystemAgent };

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

export type PluginRoutingResponse = Record<string, PluginRouting>;

export interface PluginToggleResponse {
  pluginId: string;
  agentId: string;
  enabled: boolean;
}
