// Centralized types for agent-routing components
// Avoids duplication across agent/category views

export type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

export type EntityDefinition = AgentEntityDefinition | CategoryEntityDefinition;

export interface AgentEntityDefinition {
  type: "agent";
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface CategoryEntityDefinition {
  type: "category";
  key: string;
  name: string;
  description: string;
  icon?: string;
}

export type GetConfigInfo = (key: string) => ConfigInfo | null;

export type OpenConfigHandler = (key: string) => void;

export type QuickModelChangeHandler = (key: string, model: string) => void;
