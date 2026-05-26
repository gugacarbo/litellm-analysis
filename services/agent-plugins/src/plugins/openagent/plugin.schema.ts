/**
 * Auto-generated Zod schema for plugin "openagent".
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { z } from "zod";

export const openagentSchema = z.fromJSONSchema({
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/openagent/schemas/openagent.schema.json",
  title: "Oh My OpenAgent Configuration",
  description: "JSON Schema for Oh My OpenAgent configuration",
  type: "object",
  required: ["$schema", "git_master", "agents", "categories"],
  properties: {
    $schema: {
      type: "string",
      description: "JSON Schema reference URL",
    },
    globalFallbackModel: {
      type: "string",
      description: "Default fallback model identifier",
    },
    git_master: {
      $ref: "#/definitions/GitMasterConfig",
    },
    agents: {
      type: "object",
      description: "Map of agent IDs to their configurations",
      additionalProperties: {
        $ref: "#/definitions/AgentConfig",
      },
    },
    categories: {
      type: "object",
      description: "Map of category IDs to their configurations",
      additionalProperties: {
        $ref: "#/definitions/CategoryConfig",
      },
    },
  },
  definitions: {
    GitMasterConfig: {
      type: "object",
      required: ["commit_footer", "include_co_authored_by"],
      properties: {
        commit_footer: {
          type: "boolean",
          description: "Whether to add footer to commit messages",
        },
        include_co_authored_by: {
          type: "boolean",
          description: "Whether to include co-authored-by trailer",
        },
      },
    },
    AgentConfig: {
      type: "object",
      required: ["model"],
      properties: {
        model: {
          type: "string",
          description: "Primary model identifier for this agent",
        },
        description: {
          type: "string",
          description: "Human-readable description of the agent",
        },
        color: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$",
          description: "Hex color code for UI representation",
        },
        disable: {
          type: "boolean",
          description: "Whether the agent is disabled",
        },
        mode: {
          type: "string",
          enum: ["subagent", "standalone"],
          description: "Operating mode of the agent",
        },
        tools: {
          type: "object",
          description: "Tool configuration for the agent",
          additionalProperties: true,
        },
      },
    },
    CategoryConfig: {
      type: "object",
      required: ["model"],
      properties: {
        model: {
          type: "string",
          description: "Primary model identifier for this category",
        },
        description: {
          type: "string",
          description: "Human-readable description of the category",
        },
        color: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$",
          description: "Hex color code for UI representation",
        },
      },
    },
  },
} as const);
export type OpenagentSchemaType = z.infer<typeof openagentSchema>;
