import { z } from "zod";
import {
  litellmAliasPluginConfigSchema,
  openAgentPluginConfigSchema,
  openCodePluginConfigSchema,
  vsCodePluginConfigSchema,
} from "./plugin-configs";
import { pluginRoutingSchema } from "./plugin-routing";

/** Build a plugin routing schema with a typed `config` field. */
function pluginRoutingWithConfig(configSchema: z.ZodType) {
  return pluginRoutingSchema.extend({
    config: configSchema.default({}),
  });
}

export const pluginsConfigSchema = z
  .object({
    $schema: z
      .string()
      .default("./plugins.schema.json")
      .meta({ title: "Schema", description: "JSON Schema reference" })
      .optional(),
    version: z
      .number()
      .default(2)
      .meta({ title: "Version", description: "Config version" }),
    plugins: z
      .object({
        opencode: pluginRoutingWithConfig(openCodePluginConfigSchema)
          .meta({
            title: "OpenCode",
            description: "OpenCode AI SDK plugin configuration",
          })
          .optional(),
        openagent: pluginRoutingWithConfig(openAgentPluginConfigSchema)
          .meta({
            title: "OpenAgent",
            description: "Oh My OpenAgent plugin configuration",
          })
          .optional(),
        vscode: pluginRoutingWithConfig(vsCodePluginConfigSchema)
          .meta({
            title: "VSCode",
            description: "VS Code OAICopilot plugin configuration",
          })
          .optional(),
        "litellm-alias": pluginRoutingWithConfig(litellmAliasPluginConfigSchema)
          .meta({
            title: "LiteLLM Alias",
            description: "LiteLLM Router Aliases plugin configuration",
          })
          .optional(),
      })
      .partial()
      .default({})
      .meta({ title: "Plugins", description: "Plugin configurations" }),
  })
  .strict();

export type PluginsConfig = z.infer<typeof pluginsConfigSchema>;
