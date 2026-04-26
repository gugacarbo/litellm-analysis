import { z } from "zod";

// ── Permission Schema ────────────────────────────────────────────────────────

const permissionSchema = z.object({
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

export type Permission = z.infer<typeof permissionSchema>;

// ── Thinking Schema ─────────────────────────────────────────────────────────

const thinkingSchema = z.object({
  type: z.enum(["enabled", "disabled"]),
  budgetTokens: z.number().optional(),
});

export type Thinking = z.infer<typeof thinkingSchema>;

// ── Agent Config Schema ─────────────────────────────────────────────────────

export const agentConfigSchema = z.object({
  model: z.string().optional(),
  fallback_models: z.array(z.string()).optional(),
  variant: z.string().optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]).optional(),
  color: z.string().optional(),
  permission: permissionSchema.optional(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

// ── Category Config Schema ───────────────────────────────────────────────────

export const categoryConfigSchema = z.object({
  model: z.string().optional(),
  fallback_models: z.array(z.string()).optional(),
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
  description: z.string().optional(),
});

export type CategoryConfig = z.infer<typeof categoryConfigSchema>;

// ── Git Master Schema ────────────────────────────────────────────────────────

const gitMasterSchema = z.object({
  commit_footer: z.boolean().optional(),
  include_co_authored_by: z.boolean().optional(),
});

export type GitMaster = z.infer<typeof gitMasterSchema>;

// ── Agent Config File Schema ─────────────────────────────────────────────────

export const agentConfigFileSchema = z.object({
  agents: z.record(z.string(), agentConfigSchema),
  categories: z.record(z.string(), categoryConfigSchema),
});

export type AgentConfigFile = z.infer<typeof agentConfigFileSchema>;

// Re-export schemas for index.ts
export { permissionSchema, thinkingSchema };

// ── Oh My Open Agent Config Schema ──────────────────────────────────────────

export const ohMyOpenAgentConfigSchema = z.object({
  $schema: z.string().optional(),
  globalFallbackModel: z.string().optional(),
  agents: z.record(z.string(), agentConfigSchema),
  categories: z.record(z.string(), categoryConfigSchema),
  git_master: gitMasterSchema.optional(),
});

export type OhMyOpenAgentConfig = z.infer<typeof ohMyOpenAgentConfigSchema>;
