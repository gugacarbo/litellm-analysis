import { z } from "zod";
import { thinkingSchema } from "./thinking";

export const costSchema = z.object({
  input: z
    .number()
    .default(0)
    .meta({ title: "Input Cost", description: "Cost per input token in USD" })
    .optional(),
  output: z
    .number()
    .default(0)
    .meta({ title: "Output Cost", description: "Cost per output token in USD" })
    .optional(),
});

export type Cost = z.infer<typeof costSchema>;

export const modelSpecSchema = z
  .object({
    enabled: z.boolean().optional().default(true).meta({
      title: "Enabled",
      description: "Whether this model is enabled for routing and selection",
    }),
    displayName: z.string().meta({
      title: "Display Name",
      description: "Human-readable name for the model",
    }),
    family: z
      .string()
      .optional()
      .meta({ title: "Family", description: "Model family" }),
    limits: z
      .object({
        length: z
          .number()
          .meta({
            title: "Context Length",
            description: "Maximum context window size in tokens",
          })
          .default(200000),
        maxOutput: z
          .number()
          .meta({ title: "Max Output", description: "Maximum output tokens" })
          .default(32768),
      })
      .meta({ title: "Limits", description: "Model limits" }),
    cost: costSchema.optional().meta({
      title: "Cost",
      description:
        "Model pricing in USD per token (matches LiteLLM `input_cost_per_token` / `output_cost_per_token`)",
    }),
    thinking: thinkingSchema.default({ levels: [] }).optional().meta({
      title: "Thinking",
      description: "Extended thinking configuration for this model",
    }),
  })
  .strict();

export type ModelSpec = z.infer<typeof modelSpecSchema>;
