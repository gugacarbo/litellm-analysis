import { z } from "zod";
import {
  modelAliasPluginConfigSchema,
  openAgentPluginConfigSchema,
  openCodePluginConfigSchema,
  vsCodePluginConfigSchema,
  weavePluginConfigSchema,
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
      .record(
        z.string(),
        z
          .union([
            pluginRoutingWithConfig(openCodePluginConfigSchema),
            pluginRoutingWithConfig(openAgentPluginConfigSchema),
            pluginRoutingWithConfig(vsCodePluginConfigSchema),
            pluginRoutingWithConfig(modelAliasPluginConfigSchema),
            pluginRoutingWithConfig(weavePluginConfigSchema),
          ])
          .meta({ title: "Plugin", description: "Plugin configuration" }),
      )
      .default({})
      .meta({ title: "Plugins", description: "Plugin configurations" }),
  })
  .strict();

export type PluginsConfig = z.infer<typeof pluginsConfigSchema>;
