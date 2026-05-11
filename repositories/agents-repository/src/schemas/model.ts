import { z } from "zod";
import { costSchema } from "./cost.js";

export const modelSpecSchema = z.object({
  enabled: z.boolean().optional().default(true).meta({
    title: "Enabled",
    description: "Whether this model is enabled for routing and selection",
  }),
  displayName: z
    .string()
    .meta({
      title: "Display Name",
      description: "Human-readable name for the model",
    })
    .default(""),
  family: z
    .string()
    .default("")
    .meta({ title: "Family", description: "Model family" })
    .optional(),
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
    .default({ length: 200000, maxOutput: 32768 })
    .meta({ title: "Limits", description: "Model limits" }),
  cost: costSchema
    .default({})
    .meta({ title: "Cost", description: "Model pricing per million tokens" })
    .optional(),
});

export type ModelSpec = z.infer<typeof modelSpecSchema>;
