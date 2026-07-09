export {
  type AgentPluginsOrchestrator,
  createAgentPluginsOrchestrator,
  type PluginRoutingInput,
} from "./factory";
export {
  getPluginConfigJsonSchema,
  pluginConfigJsonSchemas,
} from "./plugin-config-schemas";
export type { ModelAliasPluginConfig } from "./plugins/model-alias/config/config";
export { modelAliasSchema as modelAliasPluginConfigSchema } from "./plugins/model-alias/schema/schema";
export type { OpenAgentPluginConfig } from "./plugins/openagent/config/config";
export { openagentSchema as openAgentPluginConfigSchema } from "./plugins/openagent/schema/schema";
export type { OpenCodePluginConfig } from "./plugins/opencode/config/config";
export { opencodeSchema as openCodePluginConfigSchema } from "./plugins/opencode/plugin.schema";
export type { VsCodePluginConfig } from "./plugins/vscode/config/config";
export { vscodeSchema as vsCodePluginConfigSchema } from "./plugins/vscode/schema/schema";
export type { WeavePluginConfig } from "./plugins/weave/config/config";
export { weaveSchema as weavePluginConfigSchema } from "./plugins/weave/schema/schema";
