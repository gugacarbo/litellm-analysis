import { z } from "zod";
import { categoryEntrySchema } from "./category";
import { pluginRoutingSchema } from "./plugin-routing";
import { systemAgentSchema } from "./system-agent";

export const agentsConfigSchema = z
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
  })
  .strict();

export type AgentsConfig = z.infer<typeof agentsConfigSchema>;

// DbConfig is the merged type used by consumers — agents config + plugins
export type DbConfig = AgentsConfig & {
  plugins: Record<string, z.infer<typeof pluginRoutingSchema>>;
};
