import { createModelAliasPlugin } from "./plugins/model-alias/factory/plugin.factory";
import { createOpenAgentPlugin } from "./plugins/openagent/factory/plugin.factory";
import { createOpenCodePlugin } from "./plugins/opencode/factory/plugin.factory";
import { createVsCodePlugin } from "./plugins/vscode/factory/plugin.factory";
import { createWeavePlugin } from "./plugins/weave/factory/plugin.factory";
import type { CreatePluginOptions, PluginDefinition } from "./sdk";

export function createPluginCatalog(
  options: CreatePluginOptions = {},
): PluginDefinition<string, Record<string, unknown>, unknown>[] {
  return [
    createOpenCodePlugin(),
    createOpenAgentPlugin(),
    createVsCodePlugin(),
    createModelAliasPlugin(options),
    createWeavePlugin(),
  ];
}
