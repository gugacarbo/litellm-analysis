import { z } from "zod";

export const reasoningSchema = z
  .object({
    effort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  })
  .optional();

export type ReasoningConfig = z.infer<typeof reasoningSchema>;
