/**
 * Auto-generated from litellm-alias.schema.json
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm generate:schemas
 * Generated using z.fromJSONSchema() from Zod v4
 */

import { z } from "zod";

export const litellmAliasSchema = z.fromJSONSchema({
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
  title: "LiteLLM Router Aliases Configuration",
  description: "JSON Schema for LiteLLM model_group_alias configuration",
  type: "object",
  required: ["$schema", "model_group_alias"],
  properties: {
    $schema: {
      type: "string",
      description: "JSON Schema reference URL",
    },
    model_group_alias: {
      type: "object",
      description: "Map of virtual model names to real model names for routing",
      additionalProperties: {
        type: "string",
        description: "Real model name that the alias resolves to",
      },
    },
  },
} as const);

export type LitellmAliasOutput = z.infer<typeof litellmAliasSchema>;
