/**
 * Auto-generated Zod schema from opencode.schema.json
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm generate:schemas
 * Generated using z.fromJSONSchema() from Zod v4
 */

import { z } from "zod";

// Re-export the schema directly from JSON using z.fromJSONSchema
export const openCodeSchema = z.fromJSONSchema({
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/packages/agents-manager/src/plugins/opencode/schemas/opencode.schema.json",
  title: "OpenCode Provider Configuration",
  description: "JSON Schema for OpenCode AI SDK provider configuration",
  type: "object",
  required: ["provider"],
  properties: {
    provider: {
      type: "object",
      description: "Map of provider names to their configurations",
      additionalProperties: {
        $ref: "#/definitions/ProviderConfig",
      },
    },
  },
  definitions: {
    ProviderConfig: {
      type: "object",
      required: ["npm", "options", "models"],
      properties: {
        name: {
          type: "string",
          description: "Display name of the provider",
        },
        npm: {
          type: "string",
          description: "NPM package name for the provider",
        },
        options: {
          $ref: "#/definitions/ProviderOptions",
        },
        models: {
          type: "object",
          description: "Map of model IDs to their configurations",
          additionalProperties: {
            $ref: "#/definitions/ModelConfig",
          },
        },
      },
    },
    ProviderOptions: {
      type: "object",
      required: ["baseURL", "apiKey"],
      properties: {
        baseURL: {
          type: "string",
          description: "Base URL for the API endpoint",
        },
        apiKey: {
          type: "string",
          description: "API key for authentication",
        },
      },
    },
    ModelConfig: {
      type: "object",
      required: ["id", "name", "limit"],
      properties: {
        id: {
          type: "string",
          description: "Unique identifier for the model",
        },
        name: {
          type: "string",
          description: "Display name of the model",
        },
        limit: {
          $ref: "#/definitions/ModelLimits",
        },
        cost: {
          type: "object",
          description: "Cost configuration per million tokens",
          properties: {
            input: {
              type: "number",
              minimum: 0,
              description: "Input cost per million tokens",
            },
            output: {
              type: "number",
              minimum: 0,
              description: "Output cost per million tokens",
            },
          },
        },
      },
    },
    ModelLimits: {
      type: "object",
      required: ["context", "output"],
      properties: {
        context: {
          type: "integer",
          minimum: 1,
          description: "Maximum context window size in tokens",
        },
        output: {
          type: "integer",
          minimum: 1,
          description: "Maximum output tokens",
        },
      },
    },
  },
} as const);
export type OpenCode = z.infer<typeof openCodeSchema>;
