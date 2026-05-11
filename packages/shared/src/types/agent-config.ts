// Re-export SystemAgent types from agents-manager
// Old AgentConfig / CategoryConfig types are removed.
// Use SystemAgent for both agents and categories.
export type {
  AgentExtraConfig,
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "@lite-llm/agents-manager";
