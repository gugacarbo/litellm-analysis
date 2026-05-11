import { z } from "zod";

export const thinkingSchema = z.object({
  type: z
    .enum(["enabled", "disabled"])
    .default("disabled")
    .meta({ title: "Type", description: "Thinking mode type" }),
  budgetTokens: z
    .number()
    .default(0)
    .meta({ title: "Budget Tokens", description: "Token budget for thinking" })
    .optional(),
});

export type ThinkingConfig = z.infer<typeof thinkingSchema>;
