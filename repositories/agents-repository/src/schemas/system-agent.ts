import { costSchema } from "@lite-llm/models-repository/schemas";
import { z } from "zod";
import { agentExtraConfigSchema } from "./agent-extra-config";

export const systemAgentSchema = z.object({
  displayName: z
    .string()
    .default("")
    .meta({ title: "Display Name", description: "Agent display name" }),
  icon: z
    .string()
    .default("🤖")
    .meta({ title: "Icon", description: "Icon identifier" }),
  description: z
    .string()
    .default("")
    .meta({ title: "Description", description: "Agent description" }),
  limits: z
    .object({
      context: z
        .number()
        .default(200000)
        .meta({ title: "Context Limit", description: "Context window size" }),
      output: z
        .number()
        .default(32768)
        .meta({ title: "Output Limit", description: "Maximum output tokens" }),
    })
    .default({ context: 200000, output: 32768 })
    .meta({ title: "Limits", description: "Model limits" }),
  cost: costSchema
    .default({})
    .meta({ title: "Cost", description: "Agent pricing" })
    .optional(),
  model: z
    .string()
    .default("")
    .meta({ title: "Model", description: "Model identifier" }),
  fallbackModels: z
    .array(z.string())
    .default([])
    .meta({ title: "Fallback Models", description: "Fallback models" })
    .optional(),
  config: agentExtraConfigSchema.default({}).meta({
    title: "Config",
    description: "Extra agent configuration",
  }),
});

export type SystemAgent = z.infer<typeof systemAgentSchema>;
