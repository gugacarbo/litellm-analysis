export interface SystemAgentDTO {
  id: string;
  displayName: string;
  icon: string;
  description: string;
  versions: AgentVersionDTO[];
  model: string;
  fallbackModels: string[];
  enabledPlugins: string[];
  mode?: string;
  color?: string;
  disable?: boolean;
}

export interface AgentVersionDTO {
  id: string;
  name: string;
  model: string;
  enabled: boolean;
}

export interface PluginRoutingDTO {
  agentId: string;
  plugins: string[];
  outputFile: string;
}

export interface PluginInfoDTO {
  id: string;
  name: string;
  builtin: boolean;
  enabled: boolean;
  outputFile: string;
  agentCount: number;
  enabledAgentCount: number;
}

export interface AgentCatalogResponse {
  agents: SystemAgentDTO[];
}

export interface PluginRoutingResponse {
  routing: PluginRoutingDTO;
  plugins: PluginInfoDTO[];
}
