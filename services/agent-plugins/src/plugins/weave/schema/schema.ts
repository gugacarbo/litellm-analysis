/**
 * Auto-generated Zod schema for plugin "weave".
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { z } from "zod";

export const weaveSchema = z
  .object({
    $schema: z.string().optional(),
    agents: z
      .record(
        z.string(),
        z
          .object({
            model: z.string().optional(),
            review_models: z.array(z.string()).optional(),
            variant: z.string().optional(),
            category: z.string().optional(),
            skills: z.array(z.string()).optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            prompt_append: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            modelOptions: z.record(z.string(), z.any()).optional(),
            disable: z.boolean().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            maxTokens: z.number().optional(),
            display_name: z.string().optional(),
            color: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
    custom_agents: z
      .record(
        z.string(),
        z
          .object({
            prompt: z.string().optional(),
            prompt_file: z.string().optional(),
            model: z.string().optional(),
            display_name: z.string().optional(),
            color: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            category: z
              .enum(["exploration", "specialist", "advisor", "utility"])
              .optional(),
            cost: z.enum(["FREE", "CHEAP", "EXPENSIVE"]).optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            maxTokens: z.number().optional(),
            modelOptions: z.record(z.string(), z.any()).optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            skills: z.array(z.string()).optional(),
            triggers: z
              .array(
                z.object({ domain: z.string(), trigger: z.string() }).strict(),
              )
              .optional(),
            description: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
    categories: z
      .record(
        z.string(),
        z
          .object({
            description: z.string().optional(),
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            maxTokens: z.number().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            prompt_append: z.string().optional(),
            disable: z.boolean().optional(),
            patterns: z.array(z.string()).optional(),
          })
          .strict(),
      )
      .optional(),
    disabled_hooks: z.array(z.string()).optional(),
    disabled_tools: z.array(z.string()).optional(),
    disabled_agents: z.array(z.string()).optional(),
    disabled_skills: z.array(z.string()).optional(),
    skill_directories: z.array(z.string()).optional(),
    background: z
      .object({
        defaultConcurrency: z.number().optional(),
        providerConcurrency: z.record(z.string(), z.number()).optional(),
        modelConcurrency: z.record(z.string(), z.number()).optional(),
        staleTimeoutMs: z.number().optional(),
      })
      .strict()
      .optional(),
    analytics: z
      .object({
        enabled: z.boolean().optional(),
        use_fingerprint: z.boolean().optional(),
      })
      .strict()
      .optional(),
    continuation: z
      .object({
        recovery: z
          .object({ compaction: z.boolean().optional() })
          .strict()
          .optional(),
        idle: z
          .object({
            enabled: z.boolean().optional(),
            work: z.boolean().optional(),
            workflow: z.boolean().optional(),
            todo_prompt: z.boolean().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    tmux: z
      .object({
        enabled: z.boolean().optional(),
        layout: z
          .enum([
            "main-horizontal",
            "main-vertical",
            "tiled",
            "even-horizontal",
            "even-vertical",
          ])
          .optional(),
        main_pane_size: z.number().optional(),
      })
      .strict()
      .optional(),
    experimental: z
      .object({
        plugin_load_timeout_ms: z.number().optional(),
        context_window_warning_threshold: z.number().optional(),
        context_window_critical_threshold: z.number().optional(),
      })
      .strict()
      .optional(),
    workflows: z
      .object({
        disabled_workflows: z.array(z.string()).optional(),
        directories: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
    log_level: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).optional(),
  })
  .strict();
export type WeaveSchemaType = z.infer<typeof weaveSchema>;
