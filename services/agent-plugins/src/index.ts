// ── Agent Plugins — Plugin system for generating consumer configs ──

// Factory
export {
  createAgentPluginsOrchestrator,
  type AgentPluginsOrchestrator,
  type AgentPluginsOrchestratorOptions,
  type AgentServices,
  type AgentRepository,
  type PluginRoutingInput,
} from "./factory";

// Plugin interface
export type { IPlugin } from "./factory";

// Plugin registry
export { PluginRegistry } from "./plugins/registry";

// Individual plugins
export { OpenCodePlugin } from "./plugins/opencode/plugin";
export { OpenAgentPlugin } from "./plugins/openagent/plugin";
export { VsCodePlugin } from "./plugins/vscode/plugin";
export { LitellmAliasPlugin, type AliasDbWriter } from "./plugins/litellm-alias/plugin";
