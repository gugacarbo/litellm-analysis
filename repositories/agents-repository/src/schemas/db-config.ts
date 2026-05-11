import { z } from "zod";
import { categoryEntrySchema } from "./category.js";
import { modelSpecSchema } from "./model.js";
import { pluginRoutingConfigSchema } from "./plugin-routing.js";
import { systemAgentSchema } from "./system-agent.js";

export const dbConfigSchema = z
  .object({
    $schema: z
      .string()
      .meta({ title: "Schema", description: "JSON Schema reference" })
      .optional(),
    version: z
      .number()
      .meta({ title: "Version", description: "Config version" }),
    provider: z
      .record(
        z.string(),
        z.object({
          name: z
            .string()
            .meta({ title: "Name", description: "Provider display name" }),
          baseUrl: z.string().meta({
            title: "Base URL",
            description: "Provider API base URL",
          }),
          apiKey: z
            .string()
            .meta({ title: "API Key", description: "Provider API key" }),
        }),
      )
      .meta({
        title: "Providers",
        description: "Providers keyed by provider id",
      }),
    models: z
      .record(z.string(), modelSpecSchema)
      .meta({ title: "Models", description: "Model specifications" }),
    agents: z
      .record(z.string(), systemAgentSchema)
      .meta({ title: "Agents", description: "System agents" }),
    categories: z
      .record(z.string(), categoryEntrySchema)
      .meta({ title: "Categories", description: "Agent categories" }),
    globalFallbackModel: z
      .string()
      .meta({
        title: "Global Fallback Model",
        description: "Default fallback model",
      })
      .optional(),
    routing: pluginRoutingConfigSchema
      .meta({ title: "Routing", description: "Plugin routing configuration" })
      .optional(),
  })
  .strict();

export type DbConfig = z.infer<typeof dbConfigSchema>;
