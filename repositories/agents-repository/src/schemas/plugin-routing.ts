import { z } from "zod";

export const pluginRoutingRuleSchema = z.object({
  enabled: z
    .boolean()
    .meta({ title: "Enabled", description: "Whether the rule is enabled" }),
});

export const pluginRoutingSchema = z.object({
  enabled: z
    .boolean()
    .meta({
      title: "Enabled",
      description: "Whether plugin routing is enabled",
    }),
  outputFile: z
    .string()
    .meta({ title: "Output File", description: "Output file path" }),
  config: z
    .record(z.string(), z.unknown())
    .meta({ title: "Config", description: "Plugin configuration" })
    .optional(),
  routing: z
    .object({
      agents: z
        .record(z.string(), z.string())
        .meta({
          title: "Agents Routing",
          description: "System agent id to plugin agent id mapping",
        })
        .optional(),
      categories: z
        .record(z.string(), z.boolean())
        .meta({
          title: "Categories Routing",
          description: "Category routing enablement by category id",
        })
        .optional(),
    })
    .meta({
      title: "Routing",
      description: "Routing mappings for agents and categories",
    })
    .optional(),
});

export const pluginRoutingConfigSchema = z.object({
  version: z.number().meta({ title: "Version", description: "Config version" }),
  plugins: z
    .record(z.string(), pluginRoutingSchema)
    .meta({ title: "Plugins", description: "Plugin configurations" }),
});

export type PluginRoutingRule = z.infer<typeof pluginRoutingRuleSchema>;
export type PluginRouting = z.infer<typeof pluginRoutingSchema>;
export type PluginRoutingConfig = z.infer<typeof pluginRoutingConfigSchema>;
