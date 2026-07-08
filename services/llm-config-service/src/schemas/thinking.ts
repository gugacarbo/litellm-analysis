import { z } from "zod";

export const ReasoningSchema = z
  .object({
    effort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  })
  .optional();

export const EffortSchema = z.enum(["low", "medium", "high", "xhigh"]);

export type Effort = z.infer<typeof EffortSchema>;

export type ReasoningConfig = z.infer<typeof ReasoningSchema>;
export type Reasoning = z.infer<typeof ReasoningSchema>;
