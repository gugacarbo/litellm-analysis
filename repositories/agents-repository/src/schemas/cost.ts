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
