import { litellmAliasPluginConfigJsonSchema } from "./plugins/litellm-alias/plugin.config";
import { openAgentPluginConfigJsonSchema } from "./plugins/openagent/plugin.config";
import { openCodePluginConfigJsonSchema } from "./plugins/opencode/plugin.config";
import { vsCodePluginConfigJsonSchema } from "./plugins/vscode/plugin.config";
import { weavePluginConfigJsonSchema } from "./plugins/weave/plugin.config";

export const pluginConfigJsonSchemas: Record<
  string,
  Record<string, unknown>
> = {
  opencode: openCodePluginConfigJsonSchema as Record<string, unknown>,
  openagent: openAgentPluginConfigJsonSchema as Record<string, unknown>,
  vscode: vsCodePluginConfigJsonSchema as Record<string, unknown>,
  "litellm-alias": litellmAliasPluginConfigJsonSchema as Record<
    string,
    unknown
  >,
  weave: weavePluginConfigJsonSchema as Record<string, unknown>,
};

export function getPluginConfigJsonSchema(
  pluginId: string,
): Record<string, unknown> | null {
  return pluginConfigJsonSchemas[pluginId] ?? null;
}
