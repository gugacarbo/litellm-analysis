import { z } from "zod";

const weaveAgentOutputSchema = z.object({
  display_name: z.string(),
  model: z.string(),
  fallback_models: z.array(z.string()),
  temperature: z.number(),
  color: z.string(),
  category: z.string().optional(),
});

const weaveCategoryOutputSchema = z.object({
  description: z.string(),
  model: z.string(),
  fallback_models: z.array(z.string()),
  temperature: z.number(),
});

export const weaveOutputSchema = z.object({
  $schema: z.string(),
  log_level: z.string(),
  tmux: z.object({ enabled: z.boolean() }),
  analytics: z.object({ enabled: z.boolean(), use_fingerprint: z.boolean() }),
  continuation: z.object({
    recovery: z.object({ compaction: z.boolean() }),
    idle: z.object({
      enabled: z.boolean(),
      work: z.boolean(),
      workflow: z.boolean(),
      todo_prompt: z.boolean(),
    }),
  }),
  skill_directories: z.array(z.string()),
  agents: z.record(z.string(), weaveAgentOutputSchema),
  categories: z.record(z.string(), weaveCategoryOutputSchema),
});

export type WeaveOutput = z.infer<typeof weaveOutputSchema>;
