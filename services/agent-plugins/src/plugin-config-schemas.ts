import { modelAliasPluginConfigJsonSchema } from "./plugins/model-alias/config/config";
import { openAgentPluginConfigJsonSchema } from "./plugins/openagent/config/config";
import { openCodePluginConfigJsonSchema } from "./plugins/opencode/config/config";
import { vsCodePluginConfigJsonSchema } from "./plugins/vscode/config/config";
import { weavePluginConfigJsonSchema } from "./plugins/weave/config/config";

export const pluginConfigJsonSchemas: Record<
  string,
  Record<string, unknown>
> = {
  opencode: openCodePluginConfigJsonSchema as Record<string, unknown>,
  openagent: openAgentPluginConfigJsonSchema as Record<string, unknown>,
  vscode: vsCodePluginConfigJsonSchema as Record<string, unknown>,
  "model-alias": modelAliasPluginConfigJsonSchema as Record<
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
