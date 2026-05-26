/**
 * Auto-generated Zod schema for plugin "openagent".
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { z } from "zod";

export const openagentSchema = z.object({
  $schema: z.string().optional(),
  disabled_mcps: z.array(z.string()).optional(),
  disabled_agents: z
    .array(
      z.enum([
        "sisyphus",
        "prometheus",
        "oracle",
        "librarian",
        "explore",
        "multimodal-looker",
        "metis",
        "momus",
        "atlas",
      ]),
    )
    .optional(),
  disabled_skills: z
    .array(
      z.enum(["playwright", "agent-browser", "frontend-ui-ux", "git-master"]),
    )
    .optional(),
  disabled_hooks: z
    .array(
      z.enum([
        "todo-continuation-enforcer",
        "context-window-monitor",
        "session-recovery",
        "session-notification",
        "comment-checker",
        "grep-output-truncator",
        "tool-output-truncator",
        "directory-agents-injector",
        "directory-readme-injector",
        "empty-task-response-detector",
        "think-mode",
        "anthropic-context-window-limit-recovery",
        "rules-injector",
        "background-notification",
        "auto-update-checker",
        "startup-toast",
        "keyword-detector",
        "agent-usage-reminder",
        "non-interactive-env",
        "interactive-bash-session",
        "thinking-block-validator",
        "ralph-loop",
        "compaction-context-injector",
        "claude-code-hooks",
        "auto-slash-command",
        "edit-error-recovery",
        "delegate-task-retry",
        "prometheus-md-only",
        "sisyphus-junior-notepad",
        "start-work",
        "atlas",
      ]),
    )
    .optional(),
  disabled_commands: z.array(z.enum(["init-deep", "start-work"])).optional(),
  agents: z
    .object({
      build: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      plan: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      sisyphus: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      "sisyphus-junior": z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      "OpenCode-Builder": z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      prometheus: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      metis: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      momus: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      oracle: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      librarian: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      explore: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      "multimodal-looker": z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
      atlas: z
        .object({
          model: z.string().optional(),
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
          permission: z
            .object({
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
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  categories: z
    .record(
      z.string(),
      z.object({
        description: z.string().optional(),
        model: z.string().optional(),
        variant: z.string().optional(),
        temperature: z.number().optional(),
        top_p: z.number().optional(),
        maxTokens: z.number().optional(),
        thinking: z
          .object({
            type: z.enum(["enabled", "disabled"]),
            budgetTokens: z.number().optional(),
          })
          .optional(),
        reasoningEffort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
        textVerbosity: z.enum(["low", "medium", "high"]).optional(),
        tools: z.record(z.string(), z.boolean()).optional(),
        prompt_append: z.string().optional(),
        is_unstable_agent: z.boolean().optional(),
      }),
    )
    .optional(),
  claude_code: z
    .object({
      mcp: z.boolean().optional(),
      commands: z.boolean().optional(),
      skills: z.boolean().optional(),
      agents: z.boolean().optional(),
      hooks: z.boolean().optional(),
      plugins: z.boolean().optional(),
      plugins_override: z.record(z.string(), z.boolean()).optional(),
    })
    .optional(),
  sisyphus_agent: z
    .object({
      disabled: z.boolean().optional(),
      default_builder_enabled: z.boolean().optional(),
      planner_enabled: z.boolean().optional(),
      replace_plan: z.boolean().optional(),
    })
    .optional(),
  comment_checker: z
    .object({ custom_prompt: z.string().optional() })
    .optional(),
  experimental: z
    .object({
      aggressive_truncation: z.boolean().optional(),
      auto_resume: z.boolean().optional(),
      truncate_all_tool_outputs: z.boolean().optional(),
      dynamic_context_pruning: z
        .object({
          enabled: z.boolean().optional(),
          notification: z.enum(["off", "minimal", "detailed"]).optional(),
          turn_protection: z
            .object({
              enabled: z.boolean().optional(),
              turns: z.number().optional(),
            })
            .optional(),
          protected_tools: z.array(z.string()).optional(),
          strategies: z
            .object({
              deduplication: z
                .object({ enabled: z.boolean().optional() })
                .optional(),
              supersede_writes: z
                .object({
                  enabled: z.boolean().optional(),
                  aggressive: z.boolean().optional(),
                })
                .optional(),
              purge_errors: z
                .object({
                  enabled: z.boolean().optional(),
                  turns: z.number().optional(),
                })
                .optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  auto_update: z.boolean().optional(),
  skills: z
    .union([
      z.array(z.string()),
      z
        .record(
          z.string(),
          z.union([
            z.boolean(),
            z.object({
              description: z.string().optional(),
              template: z.string().optional(),
              from: z.string().optional(),
              model: z.string().optional(),
              agent: z.string().optional(),
              subtask: z.boolean().optional(),
              "argument-hint": z.string().optional(),
              license: z.string().optional(),
              compatibility: z.string().optional(),
              metadata: z.record(z.string(), z.any()).optional(),
              "allowed-tools": z.array(z.string()).optional(),
              disable: z.boolean().optional(),
            }),
          ]),
        )
        .and(
          z.object({
            sources: z
              .array(
                z.union([
                  z.string(),
                  z.object({
                    path: z.string(),
                    recursive: z.boolean().optional(),
                    glob: z.string().optional(),
                  }),
                ]),
              )
              .optional(),
            enable: z.array(z.string()).optional(),
            disable: z.array(z.string()).optional(),
          }),
        ),
    ])
    .optional(),
  ralph_loop: z
    .object({
      enabled: z.boolean().optional(),
      default_max_iterations: z.number().optional(),
      state_dir: z.string().optional(),
    })
    .optional(),
  background_task: z
    .object({
      defaultConcurrency: z.number().optional(),
      providerConcurrency: z.record(z.string(), z.number()).optional(),
      modelConcurrency: z.record(z.string(), z.number()).optional(),
      staleTimeoutMs: z.number().optional(),
    })
    .optional(),
  notification: z.object({ force_enable: z.boolean().optional() }).optional(),
  git_master: z
    .object({
      commit_footer: z.boolean().optional(),
      include_co_authored_by: z.boolean().optional(),
    })
    .optional(),
  browser_automation_engine: z
    .object({ provider: z.enum(["playwright", "agent-browser"]).optional() })
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
    .optional(),
});
export type OpenagentSchemaType = z.infer<typeof openagentSchema>;
