// ── Agent Plugins — Plugin system for generating consumer configs ──

// Plugin interface
export type { IPlugin } from "./factory";
// Factory
export {
  type AgentPluginsOrchestrator,
  type AgentPluginsOrchestratorOptions,
  type AgentRepository,
  type AgentServices,
  createAgentPluginsOrchestrator,
  type PluginRoutingInput,
} from "./factory";
export {
  type AliasDbWriter,
  LitellmAliasPlugin,
} from "./plugins/litellm-alias/plugin";
export { OpenAgentPlugin } from "./plugins/openagent/plugin";
// Individual plugins
export { OpenCodePlugin } from "./plugins/opencode/plugin";
// Plugin registry
export { PluginRegistry } from "./plugins/registry";
export { VsCodePlugin } from "./plugins/vscode/plugin";
