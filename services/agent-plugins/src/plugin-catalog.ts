import { createLitellmAliasPlugin } from "./plugins/litellm-alias/plugin";
import { createOpenAgentPlugin } from "./plugins/openagent/plugin";
import { createOpenCodePlugin } from "./plugins/opencode/plugin";
import { createVsCodePlugin } from "./plugins/vscode/plugin";
import { createWeavePlugin } from "./plugins/weave/plugin";
import type { CreatePluginOptions, PluginDefinition } from "./sdk";

export function createPluginCatalog(
  options: CreatePluginOptions = {},
): PluginDefinition<string, Record<string, unknown>, unknown>[] {
  return [
    createOpenCodePlugin(),
    createOpenAgentPlugin(),
    createVsCodePlugin(),
    createLitellmAliasPlugin(options),
    createWeavePlugin(),
  ];
}
