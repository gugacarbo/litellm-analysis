import { z } from "zod";
import { categoryEntrySchema } from "./category.js";
import { modelSpecSchema } from "./model.js";
import { pluginRoutingSchema } from "./plugin-routing.js";
import { systemAgentSchema } from "./system-agent.js";

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
    provider: z
      .record(
        z.string(),
        z.object({
          name: z
            .string()
            .default("")
            .meta({ title: "Name", description: "Provider display name" }),
          ownedBy: z.string().default("").meta({
            title: "Owned By",
            description: "Organization that owns this provider",
          }),
          baseUrl: z.string().default("").meta({
            title: "Base URL",
            description: "Provider API base URL",
          }),
          apiKey: z
            .string()
            .default("")
            .meta({ title: "API Key", description: "Provider API key" }),
        }),
      )
      .default({})
      .meta({
        title: "Providers",
        description: "Providers keyed by provider id",
      }),
    models: z
      .record(z.string(), modelSpecSchema)
      .default({})
      .meta({ title: "Models", description: "Model specifications" }),
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
