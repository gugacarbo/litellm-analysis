import { z } from "zod";

export const agentExtraConfigSchema = z.object({
  mode: z
    .enum(["subagent", "primary", "all"])
    .meta({ title: "Mode", description: "Agent operating mode" })
    .optional(),
  tools: z
    .record(z.string(), z.boolean())
    .meta({ title: "Tools", description: "Tool enable/disable map" })
    .optional(),
  permissions: z
    .record(z.string(), z.unknown())
    .meta({ title: "Permissions", description: "Permission overrides" })
    .optional(),
  color: z
    .string()
    .meta({ title: "Color", description: "Display color" })
    .optional(),
  disable: z
    .boolean()
    .meta({ title: "Disable", description: "Whether agent is disabled" })
    .optional(),
  variant: z
    .string()
    .meta({ title: "Variant", description: "Agent variant" })
    .optional(),
  category: z
    .string()
    .meta({ title: "Category", description: "Agent category" })
    .optional(),
  skills: z
    .array(z.string())
    .meta({ title: "Skills", description: "Enabled skills" })
    .optional(),
  temperature: z
    .number()
    .meta({ title: "Temperature", description: "Sampling temperature" })
    .optional(),
  topP: z
    .number()
    .meta({ title: "Top P", description: "Nucleus sampling" })
    .optional(),
  prompt: z
    .string()
    .meta({ title: "System Prompt", description: "System prompt override" })
    .optional(),
  promptAppend: z
    .string()
    .meta({ title: "Prompt Append", description: "Text to append to prompts" })
    .optional(),
});

export type AgentExtraConfig = z.infer<typeof agentExtraConfigSchema>;
