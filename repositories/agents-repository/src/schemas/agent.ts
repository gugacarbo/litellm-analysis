import { z } from "zod";
import { permissionSchema } from "./permission";

export const agentEntrySchema = z.object({
  model: z
    .string()
    .default("")
    .meta({ title: "Model", description: "Model identifier" }),
  description: z
    .string()
    .default("")
    .meta({ title: "Description", description: "Agent description" })
    .optional(),
  color: z
    .string()
    .default("")
    .meta({ title: "Color", description: "Display color for the agent" })
    .optional(),
  disable: z
    .boolean()
    .default(false)
    .meta({ title: "Disable", description: "Whether the agent is disabled" })
    .optional(),
  variant: z
    .string()
    .default("")
    .meta({ title: "Variant", description: "Agent variant identifier" })
    .optional(),
  category: z
    .string()
    .default("")
    .meta({ title: "Category", description: "Agent category" })
    .optional(),
  skills: z
    .array(z.string())
    .default([])
    .meta({ title: "Skills", description: "List of enabled skills" })
    .optional(),
  temperature: z
    .number()
    .default(0)
    .meta({ title: "Temperature", description: "Sampling temperature" })
    .optional(),
  topP: z
    .number()
    .default(1)
    .meta({ title: "Top P", description: "Nucleus sampling threshold" })
    .optional(),
  prompt: z
    .string()
    .default("")
    .meta({ title: "System Prompt", description: "System prompt override" })
    .optional(),
  promptAppend: z
    .string()
    .default("")
    .meta({
      title: "Prompt Append",
      description: "Text to append to all prompts",
    })
    .optional(),
  tools: z
    .record(
      z.string(),
      z
        .boolean()
        .default(false)
        .meta({ title: "Tool", description: "Tool enabled state" }),
    )
    .default({})
    .meta({ title: "Tools", description: "Tool enable/disable map" })
    .optional(),
  mode: z
    .enum(["subagent", "primary", "all"])
    .default("all")
    .meta({ title: "Mode", description: "Agent operating mode" })
    .optional(),
  permissions: permissionSchema
    .default({})
    .meta({ title: "Permissions", description: "Agent permissions" })
    .optional(),
});

export type AgentEntry = z.infer<typeof agentEntrySchema>;
