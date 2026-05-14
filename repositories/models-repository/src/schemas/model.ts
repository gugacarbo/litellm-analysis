import { z } from "zod";

export const costSchema = z.object({
  input: z
    .number()
    .default(0)
    .meta({ title: "Input Cost", description: "Cost per million input tokens" })
    .optional(),
  output: z
    .number()
    .default(0)
    .meta({
      title: "Output Cost",
      description: "Cost per million output tokens",
    })
    .optional(),
});

export type Cost = z.infer<typeof costSchema>;

export const modelSpecSchema = z
  .object({
    enabled: z
      .boolean()
      .optional()
      .default(true)
      .meta({
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
    cost: costSchema
      .optional()
      .meta({
        title: "Cost",
        description: "Model pricing per million tokens",
      }),
  })
  .strict();

export type ModelSpec = z.infer<typeof modelSpecSchema>;
