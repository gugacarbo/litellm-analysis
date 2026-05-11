import { z } from "zod";
import { agentExtraConfigSchema } from "./agent-extra-config.js";
import { costSchema } from "./cost.js";

export const systemAgentSchema = z.object({
  displayName: z
    .string()
    .meta({ title: "Display Name", description: "Agent display name" }),
  icon: z.string().meta({ title: "Icon", description: "Icon identifier" }),
  description: z
    .string()
    .meta({ title: "Description", description: "Agent description" }),
  limits: z
    .object({
      context: z
        .number()
        .meta({ title: "Context Limit", description: "Context window size" }),
      output: z
        .number()
        .meta({ title: "Output Limit", description: "Maximum output tokens" }),
    })
    .meta({ title: "Limits", description: "Model limits" }),
  cost: costSchema
    .meta({ title: "Cost", description: "Agent pricing" })
    .optional(),
  model: z.string().meta({ title: "Model", description: "Model identifier" }),
  fallbackModels: z
    .array(z.string())
    .meta({ title: "Fallback Models", description: "Fallback models" }),
  config: agentExtraConfigSchema.meta({
    title: "Config",
    description: "Extra agent configuration",
  }),
});

export type SystemAgent = z.infer<typeof systemAgentSchema>;
