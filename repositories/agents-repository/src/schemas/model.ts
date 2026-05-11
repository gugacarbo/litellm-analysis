import { z } from "zod";
import { costSchema } from "./cost.js";

export const modelSpecSchema = z.object({
  displayName: z.string().meta({
    title: "Display Name",
    description: "Human-readable name for the model",
  }),
  ownedBy: z
    .string()
    .meta({
      title: "Owned By",
      description: "Organization that owns the model",
    })
    .optional(),
  family: z
    .string()
    .meta({ title: "Family", description: "Model family" })
    .optional(),
  contextLength: z.number().meta({
    title: "Context Length",
    description: "Maximum context window size in tokens",
  }),
  maxOutput: z
    .number()
    .meta({ title: "Max Output", description: "Maximum output tokens" }),
  cost: costSchema
    .meta({ title: "Cost", description: "Model pricing per million tokens" })
    .optional(),
});

export type ModelSpec = z.infer<typeof modelSpecSchema>;
