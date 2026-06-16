import { z } from "zod";

export const thinkingSchema = z.object({
  levels: z.array(z.string()).default([]).meta({
    title: "Levels",
    description: "Available thinking levels for this model",
  }),
});

export type ThinkingConfig = z.infer<typeof thinkingSchema>;

export const reasoningSchema = z
  .object({
    effort: z.enum(["low", "medium", "high", "xhigh"]).optional().meta({
      title: "Reasoning Effort",
      description: "Default reasoning budget level for this model",
    }),
    enableThinking: z.boolean().optional().meta({
      title: "Enable Thinking",
      description: "Whether to request thinking/reasoning content",
    }),
    includeReasoningInRequest: z.boolean().optional().meta({
      title: "Include Reasoning in Request",
      description: "Whether reasoning content is included in the request body",
    }),
  })
  .optional()
  .meta({ title: "Reasoning", description: "Runtime reasoning configuration" });

export type ReasoningConfig = z.infer<typeof reasoningSchema>;
