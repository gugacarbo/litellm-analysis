import type {
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "@litellm/shared";

export type { PluginRoutingConfig, PluginRoutingRule, SystemAgent };

export interface PluginInfo {
  id: string;
  name: string;
  builtin: boolean;
  enabled: boolean;
  outputFile: string;
  agentCount: number;
  enabledAgentCount: number;
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
