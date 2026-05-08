// ── Types Barrel ──
// Re-exports all generic type definitions for the agents-manager architecture.

// Re-export shared plugin types from the original plugin module
export type {
  IPlugin,
  IPluginRegistry,
  PluginEntry,
  PluginModel,
  TransformContext,
} from "../plugins/plugin.js";

export type { PluginRoutingConfig, PluginRoutingRule } from "./routing.js";
export type {
  AgentExtraConfig,
  AgentVersion,
  SystemAgent,
} from "./system-agent.js";
