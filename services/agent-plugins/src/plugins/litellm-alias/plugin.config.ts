import { z } from "zod";

export const litellmAliasPluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "LiteLLM Router Aliases config schema URL",
      }),
    aliasPrefix: z
      .string()
      .default("")
      .meta({
        title: "Alias Prefix",
        description: "Text prepended to all generated alias names",
      }),
    includeAgents: z
      .boolean()
      .default(true)
      .meta({
        title: "Include Agents",
        description: "Include agent-based aliases in output",
      }),
    includeCategories: z
      .boolean()
      .default(true)
      .meta({
        title: "Include Categories",
        description: "Include category-based aliases in output",
      }),
    globalFallbackOverride: z
      .string()
      .default("")
      .meta({
        title: "Global Fallback Override",
        description: "Override global fallback model (empty = use default)",
      }),
  })
  .meta({
    title: "LiteLLM Alias Config",
    description: "LiteLLM Router Aliases plugin configuration",
  });

export type LitellmAliasPluginConfig = z.infer<
  typeof litellmAliasPluginConfigSchema
> & { [key: string]: unknown };

export const litellmAliasPluginConfigJsonSchema = z.toJSONSchema(
  litellmAliasPluginConfigSchema,
);
