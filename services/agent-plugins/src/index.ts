export { PluginExecutionError } from "./errors";
export {
  type AgentPluginsOrchestrator,
  type AgentPluginsOrchestratorOptions,
  type AgentRepository,
  type AgentServices,
  createAgentPluginsOrchestrator,
  type PluginRoutingInput,
} from "./factory";
export { normalizeAgentMappings } from "./helpers";
export { ensurePluginSchemas } from "./lib/ensure-plugin-schemas";
export {
  type RegisteredPluginSchema,
  registeredPluginSchemas,
} from "./lib/plugin-schemas";
export { createPluginCatalog } from "./plugin-catalog";
export {
  createPluginRegistry,
  type PluginConfigInput,
  type PluginRegistryV2,
} from "./plugin-registry";
export {
  createLitellmAliasPlugin,
  litellmAliasManifest,
} from "./plugins/litellm-alias/plugin";
export {
  createOpenAgentPlugin,
  openAgentManifest,
} from "./plugins/openagent/plugin";
export {
  createOpenCodePlugin,
  openCodeManifest,
} from "./plugins/opencode/plugin";
export { createVsCodePlugin, vsCodeManifest } from "./plugins/vscode/plugin";
export { createWeavePlugin, weaveManifest } from "./plugins/weave/plugin";
export type {
  CreatePluginOptions,
  PluginDefinition,
  PluginExecutionPayload,
  PluginHandlers,
  PluginId,
  PluginManifest,
  PluginRoutingFor,
  PluginRuntimeContext,
} from "./sdk";
