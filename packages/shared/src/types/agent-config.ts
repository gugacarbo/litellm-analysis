// Re-export SystemAgent types from agents-manager
// Old AgentConfig / CategoryConfig types are removed.
// Use SystemAgent for both agents and categories.
export type {
  AgentExtraConfig,
  AgentVersion,
  SystemAgent,
} from "@lite-llm/agents-manager";

export type {
  PluginRoutingConfig,
  PluginRoutingRule,
} from "@lite-llm/agents-manager";
