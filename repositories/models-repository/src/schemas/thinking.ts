import { z } from "zod";

export const thinkingSchema = z.object({
  levels: z.array(z.string()).default([]).meta({
    title: "Levels",
    description: "Available thinking levels for this model",
  }),
});

export type ThinkingConfig = z.infer<typeof thinkingSchema>;
