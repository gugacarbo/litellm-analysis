import { z } from "zod";
import { pluginRoutingSchema } from "./plugin-routing";

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
      .record(z.string(), pluginRoutingSchema)
      .default({})
      .meta({ title: "Plugins", description: "Plugin configurations" }),
  })
  .strict();

export type PluginsConfig = z.infer<typeof pluginsConfigSchema>;