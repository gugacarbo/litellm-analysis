import { z } from "zod";
import { categoryEntrySchema } from "./category";
import { pluginRoutingSchema } from "./plugin-routing";
import { systemAgentSchema } from "./system-agent";

export const dbConfigSchema = z
  .object({
    $schema: z
      .string()
      .default("./agents.schema.json")
      .meta({ title: "Schema", description: "JSON Schema reference" })
      .optional(),
    version: z
      .number()
      .default(1)
      .meta({ title: "Version", description: "Config version" }),
    agents: z
      .record(z.string(), systemAgentSchema)
      .default({})
      .meta({ title: "Agents", description: "System agents" }),
    categories: z
      .record(z.string(), categoryEntrySchema)
      .default({})
      .meta({ title: "Categories", description: "Agent categories" }),
    globalFallbackModel: z
      .string()
      .default("")
      .meta({
        title: "Global Fallback Model",
        description: "Default fallback model",
      })
      .optional(),
    plugins: z
      .record(z.string(), pluginRoutingSchema)
      .default({})
      .meta({ title: "Plugins", description: "Plugin configurations" })
      .optional(),
  })
  .strict();

export type DbConfig = z.infer<typeof dbConfigSchema>;
