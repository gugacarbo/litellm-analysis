import { z } from "zod";
import { permissionSchema } from "./permission.js";

export const agentEntrySchema = z.object({
  model: z.string().meta({ title: "Model", description: "Model identifier" }),
  fallbackModels: z
    .array(z.string())
    .meta({
      title: "Fallback Models",
      description: "Models to use as fallback",
    })
    .optional(),
  description: z
    .string()
    .meta({ title: "Description", description: "Agent description" })
    .optional(),
  color: z
    .string()
    .meta({ title: "Color", description: "Display color for the agent" })
    .optional(),
  disable: z
    .boolean()
    .meta({ title: "Disable", description: "Whether the agent is disabled" })
    .optional(),
  variant: z
    .string()
    .meta({ title: "Variant", description: "Agent variant identifier" })
    .optional(),
  category: z
    .string()
    .meta({ title: "Category", description: "Agent category" })
    .optional(),
  skills: z
    .array(z.string())
    .meta({ title: "Skills", description: "List of enabled skills" })
    .optional(),
  temperature: z
    .number()
    .meta({ title: "Temperature", description: "Sampling temperature" })
    .optional(),
  topP: z
    .number()
    .meta({ title: "Top P", description: "Nucleus sampling threshold" })
    .optional(),
  prompt: z
    .string()
    .meta({ title: "System Prompt", description: "System prompt override" })
    .optional(),
  promptAppend: z
    .string()
    .meta({
      title: "Prompt Append",
      description: "Text to append to all prompts",
    })
    .optional(),
  tools: z
    .record(z.string(), z.boolean())
    .meta({ title: "Tools", description: "Tool enable/disable map" })
    .optional(),
  mode: z
    .enum(["subagent", "primary", "all"])
    .meta({ title: "Mode", description: "Agent operating mode" })
    .optional(),
  permissions: permissionSchema
    .meta({ title: "Permissions", description: "Agent permissions" })
    .optional(),
});

export type AgentEntry = z.infer<typeof agentEntrySchema>;
