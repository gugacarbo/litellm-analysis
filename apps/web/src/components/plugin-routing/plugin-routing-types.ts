import type { PluginInfo } from "@lite-llm/api-contracts/agent-catalog";

export type PluginCardProps = {
  plugin: PluginInfo;
  onToggle: (pluginId: string) => void;
  onToggleAgent: (pluginId: string, agentId: string) => void;
  agentNames?: string[];
  enabledAgentIds?: string[];
};

export type PluginRoutingGridProps = {
  plugins: PluginInfo[];
  loading: boolean;
  onTogglePlugin: (pluginId: string) => void;
  onToggleAgent: (pluginId: string, agentId: string) => void;
  agentNames?: string[];
  enabledAgentIds?: string[];
};
