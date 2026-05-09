// Centralized types for agent-routing components
// Avoids duplication across agent/category views

export type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};
