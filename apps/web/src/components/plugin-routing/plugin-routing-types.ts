import type { PluginInfoDTO } from "@lite-llm/api-contracts/agent-catalog";

export type PluginCardProps = {
  plugin: PluginInfoDTO;
  onToggle: (pluginId: string) => void;
  onToggleAgent: (pluginId: string, agentId: string) => void;
  agentNames?: string[];
  enabledAgentIds?: string[];
};

export type PluginRoutingGridProps = {
  plugins: PluginInfoDTO[];
  loading: boolean;
  onTogglePlugin: (pluginId: string) => void;
  onToggleAgent: (pluginId: string, agentId: string) => void;
  agentNames?: string[];
  enabledAgentIds?: string[];
};
