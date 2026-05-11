import { z } from "zod";

export const agentExtraConfigSchema = z.object({
  mode: z
    .enum(["subagent", "primary", "all"])
    .default("all")
    .meta({ title: "Mode", description: "Agent operating mode" })
    .optional(),
  tools: z
    .record(z.string(), z.boolean())
    .default({})
    .meta({ title: "Tools", description: "Tool enable/disable map" })
    .optional(),
  permissions: z
    .record(z.string(), z.unknown())
    .default({})
    .meta({ title: "Permissions", description: "Permission overrides" })
    .optional(),
  color: z
    .string()
    .default("")
    .meta({ title: "Color", description: "Display color" })
    .optional(),
  disable: z
    .boolean()
    .default(false)
    .meta({ title: "Disable", description: "Whether agent is disabled" })
    .optional(),
  variant: z
    .string()
    .default("")
    .meta({ title: "Variant", description: "Agent variant" })
    .optional(),
  category: z
    .string()
    .default("")
    .meta({ title: "Category", description: "Agent category" })
    .optional(),
  skills: z
    .array(z.string())
    .default([])
    .meta({ title: "Skills", description: "Enabled skills" })
    .optional(),
  temperature: z
    .number()
    .default(0)
    .meta({ title: "Temperature", description: "Sampling temperature" })
    .optional(),
  topP: z
    .number()
    .default(1)
    .meta({ title: "Top P", description: "Nucleus sampling" })
    .optional(),
  prompt: z
    .string()
    .default("")
    .meta({ title: "System Prompt", description: "System prompt override" })
    .optional(),
  promptAppend: z
    .string()
    .default("")
    .meta({ title: "Prompt Append", description: "Text to append to prompts" })
    .optional(),
});

export type AgentExtraConfig = z.infer<typeof agentExtraConfigSchema>;
