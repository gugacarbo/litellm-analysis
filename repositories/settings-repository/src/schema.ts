import { z } from "zod";

// ── Zod Schemas ──

export const permissionSchema = z.object({
  edit: z.enum(["ask", "allow", "deny"]).optional(),
  bash: z
    .union([
      z.enum(["ask", "allow", "deny"]),
      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
    ])
    .optional(),
  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
  external_directory: z.enum(["ask", "allow", "deny"]).optional(),
});

export const thinkingSchema = z.object({
  type: z.enum(["enabled", "disabled"]),
  budgetTokens: z.number().optional(),
});

export const costSchema = z.object({
  input: z.number().optional(),
  output: z.number().optional(),
});

export const modelSpecSchema = z.object({
  displayName: z.string(),
  ownedBy: z.string().optional(),
  family: z.string().optional(),
  contextLength: z.number(),
  maxOutput: z.number(),
  cost: costSchema.optional(),
});

export const agentEntrySchema = z.object({
  model: z.string(),
  fallbackModels: z.array(z.string()).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  disable: z.boolean().optional(),
  variant: z.string().optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  mode: z.enum(["subagent", "primary", "all"]).optional(),
  permission: permissionSchema.optional(),
});

export const categoryEntrySchema = z.object({
  model: z.string(),
  fallbackModels: z.array(z.string()).optional(),
  description: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  maxTokens: z.number().optional(),
  thinking: thinkingSchema.optional(),
  reasoningEffort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  textVerbosity: z.enum(["low", "medium", "high"]).optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  prompt_append: z.string().optional(),
  is_unstable_agent: z.boolean().optional(),
});

export const dbConfigSchema = z.object({
  $schema: z.string().optional(),
  version: z.number(),
  litellm: z.object({
    baseUrl: z.string(),
    apiKey: z.string(),
  }),
  models: z.record(z.string(), modelSpecSchema),
  agents: z.record(z.string(), agentEntrySchema),
  categories: z.record(z.string(), categoryEntrySchema),
  globalFallbackModel: z.string().optional(),
  customAliases: z.record(z.string(), z.string()).optional(),
});

// ── TypeScript Types ──

export type ModelSpec = z.infer<typeof modelSpecSchema>;
export type AgentEntry = z.infer<typeof agentEntrySchema>;
export type CategoryEntry = z.infer<typeof categoryEntrySchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type ThinkingConfig = z.infer<typeof thinkingSchema>;
export type Cost = z.infer<typeof costSchema>;
export type DbConfig = z.infer<typeof dbConfigSchema>;
