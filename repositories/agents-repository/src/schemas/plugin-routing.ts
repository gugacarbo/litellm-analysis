import { z } from "zod";

export const pluginRoutingRuleSchema = z.object({
  enabled: z
    .boolean()
    .default(true)
    .meta({ title: "Enabled", description: "Whether the rule is enabled" }),
});

export const pluginRoutingSchema = z.object({
  enabled: z.boolean().default(false).meta({
    title: "Enabled",
    description: "Whether plugin routing is enabled",
  }),
  outputFile: z
    .string()
    .default("")
    .meta({ title: "Output File", description: "Output file path" }),
  config: z
    .record(z.string(), z.unknown())
    .default({})
    .meta({ title: "Config", description: "Plugin configuration" })
    .optional(),
  routing: z
    .object({
      agents: z
        .record(z.string(), z.string())
        .default({})
        .meta({
          title: "Agents Routing",
          description: "System agent id to plugin agent id mapping",
        })
        .optional(),
      categories: z
        .record(z.string(), z.boolean())
        .default({})
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
    .default({ agents: {}, categories: {} }),
});

export type PluginRoutingRule = z.infer<typeof pluginRoutingRuleSchema>;
export type PluginRouting = z.infer<typeof pluginRoutingSchema>;
