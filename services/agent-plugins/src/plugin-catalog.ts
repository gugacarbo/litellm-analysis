import { createModelAliasPlugin } from "./plugins/model-alias";
import { createOpenAgentPlugin } from "./plugins/openagent";
import { createOpenCodePlugin } from "./plugins/opencode";
import { createVsCodePlugin } from "./plugins/vscode";
import { createWeavePlugin } from "./plugins/weave";
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
