/**
 * Auto-generated Zod schema for plugin "opencode".
 * DO NOT EDIT MANUALLY - Regenerate with: pnpm --filter @lite-llm/agent-plugins generate:plugin-schemas
 */

import { z } from "zod";

export const opencodeSchema = z
  .object({
    $schema: z.string().optional(),
    shell: z.string().optional(),
    logLevel: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).optional(),
    server: z
      .object({
        port: z.number().optional(),
        hostname: z.string().optional(),
        mdns: z.boolean().optional(),
        mdnsDomain: z.string().optional(),
        cors: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
    command: z
      .record(
        z.string(),
        z
          .object({
            template: z.string(),
            description: z.string().optional(),
            agent: z.string().optional(),
            model: z.string().optional(),
            subtask: z.boolean().optional(),
          })
          .strict(),
      )
      .optional(),
    skills: z
      .object({
        paths: z.array(z.string()).optional(),
        urls: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
    reference: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z
            .object({ repository: z.string(), branch: z.string().optional() })
            .strict(),
          z.object({ path: z.string() }).strict(),
        ]),
      )
      .optional(),
    watcher: z
      .object({ ignore: z.array(z.string()).optional() })
      .strict()
      .optional(),
    snapshot: z.boolean().optional(),
    plugin: z.array(z.union([z.string(), z.array(z.any())])).optional(),
    share: z.enum(["manual", "auto", "disabled"]).optional(),
    autoshare: z.boolean().optional(),
    autoupdate: z.union([z.boolean(), z.enum(["notify"])]).optional(),
    disabled_providers: z.array(z.string()).optional(),
    enabled_providers: z.array(z.string()).optional(),
    model: z.string().optional(),
    small_model: z.string().optional(),
    default_agent: z.string().optional(),
    username: z.string().optional(),
    mode: z
      .object({
        build: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        plan: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
      })
      .optional(),
    agent: z
      .object({
        plan: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        build: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        general: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        explore: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        scout: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        title: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        summary: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
        compaction: z
          .object({
            model: z.string().optional(),
            variant: z.string().optional(),
            temperature: z.number().optional(),
            top_p: z.number().optional(),
            prompt: z.string().optional(),
            tools: z.record(z.string(), z.boolean()).optional(),
            disable: z.boolean().optional(),
            description: z.string().optional(),
            mode: z.enum(["subagent", "primary", "all"]).optional(),
            hidden: z.boolean().optional(),
            options: z.record(z.string(), z.any()).optional(),
            color: z
              .union([
                z.string(),
                z.enum([
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info",
                ]),
              ])
              .optional(),
            steps: z.number().optional(),
            maxSteps: z.number().optional(),
            permission: z
              .union([
                z.enum(["ask", "allow", "deny"]),
                z.object({
                  read: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  edit: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  glob: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  grep: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  list: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  bash: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  task: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  external_directory: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  todowrite: z.enum(["ask", "allow", "deny"]).optional(),
                  question: z.enum(["ask", "allow", "deny"]).optional(),
                  webfetch: z.enum(["ask", "allow", "deny"]).optional(),
                  websearch: z.enum(["ask", "allow", "deny"]).optional(),
                  repo_clone: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  repo_overview: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  lsp: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                  doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
                  skill: z
                    .union([
                      z.enum(["ask", "allow", "deny"]),
                      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
                    ])
                    .optional(),
                }),
              ])
              .optional(),
          })
          .optional(),
      })
      .optional(),
    provider: z
      .record(
        z.string(),
        z
          .object({
            api: z.string().optional(),
            name: z.string().optional(),
            env: z.array(z.string()).optional(),
            id: z.string().optional(),
            npm: z.string().optional(),
            whitelist: z.array(z.string()).optional(),
            blacklist: z.array(z.string()).optional(),
            options: z
              .object({
                apiKey: z.string().optional(),
                baseURL: z.string().optional(),
                enterpriseUrl: z.string().optional(),
                setCacheKey: z.boolean().optional(),
                timeout: z
                  .union([z.number(), z.union([z.literal(false)])])
                  .optional(),
                chunkTimeout: z.number().optional(),
              })
              .optional(),
            models: z
              .record(
                z.string(),
                z
                  .object({
                    id: z.string().optional(),
                    name: z.string().optional(),
                    family: z.string().optional(),
                    release_date: z.string().optional(),
                    attachment: z.boolean().optional(),
                    reasoning: z.boolean().optional(),
                    temperature: z.boolean().optional(),
                    tool_call: z.boolean().optional(),
                    interleaved: z
                      .union([
                        z.union([z.literal(true)]),
                        z
                          .object({
                            field: z.enum([
                              "reasoning_content",
                              "reasoning_details",
                            ]),
                          })
                          .strict(),
                      ])
                      .optional(),
                    cost: z
                      .object({
                        input: z.number(),
                        output: z.number(),
                        cache_read: z.number().optional(),
                        cache_write: z.number().optional(),
                        context_over_200k: z
                          .object({
                            input: z.number(),
                            output: z.number(),
                            cache_read: z.number().optional(),
                            cache_write: z.number().optional(),
                          })
                          .strict()
                          .optional(),
                      })
                      .strict()
                      .optional(),
                    limit: z
                      .object({
                        context: z.number(),
                        input: z.number().optional(),
                        output: z.number(),
                      })
                      .strict()
                      .optional(),
                    modalities: z
                      .object({
                        input: z.array(
                          z.enum(["text", "audio", "image", "video", "pdf"]),
                        ),
                        output: z.array(
                          z.enum(["text", "audio", "image", "video", "pdf"]),
                        ),
                      })
                      .strict()
                      .optional(),
                    experimental: z.boolean().optional(),
                    status: z
                      .enum(["alpha", "beta", "deprecated", "active"])
                      .optional(),
                    provider: z
                      .object({
                        npm: z.string().optional(),
                        api: z.string().optional(),
                      })
                      .strict()
                      .optional(),
                    options: z.record(z.string(), z.any()).optional(),
                    headers: z.record(z.string(), z.string()).optional(),
                    variants: z
                      .record(
                        z.string(),
                        z.object({ disabled: z.boolean().optional() }),
                      )
                      .optional(),
                  })
                  .strict(),
              )
              .optional(),
          })
          .strict(),
      )
      .optional(),
    mcp: z
      .record(
        z.string(),
        z.union([
          z.union([
            z
              .object({
                type: z.enum(["local"]),
                command: z.array(z.string()),
                environment: z.record(z.string(), z.string()).optional(),
                enabled: z.boolean().optional(),
                timeout: z.number().optional(),
              })
              .strict(),
            z
              .object({
                type: z.enum(["remote"]),
                url: z.string(),
                enabled: z.boolean().optional(),
                headers: z.record(z.string(), z.string()).optional(),
                oauth: z
                  .union([
                    z
                      .object({
                        clientId: z.string().optional(),
                        clientSecret: z.string().optional(),
                        scope: z.string().optional(),
                        callbackPort: z.number().optional(),
                        redirectUri: z.string().optional(),
                      })
                      .strict(),
                    z.union([z.literal(false)]),
                  ])
                  .optional(),
                timeout: z.number().optional(),
              })
              .strict(),
          ]),
          z.object({ enabled: z.boolean() }).strict(),
        ]),
      )
      .optional(),
    formatter: z
      .union([
        z.boolean(),
        z.record(
          z.string(),
          z
            .object({
              disabled: z.boolean().optional(),
              command: z.array(z.string()).optional(),
              environment: z.record(z.string(), z.string()).optional(),
              extensions: z.array(z.string()).optional(),
            })
            .strict(),
        ),
      ])
      .optional(),
    lsp: z
      .union([
        z.boolean(),
        z.record(
          z.string(),
          z.union([
            z.object({ disabled: z.union([z.literal(true)]) }).strict(),
            z
              .object({
                command: z.array(z.string()),
                extensions: z.array(z.string()).optional(),
                disabled: z.boolean().optional(),
                env: z.record(z.string(), z.string()).optional(),
                initialization: z.record(z.string(), z.any()).optional(),
              })
              .strict(),
          ]),
        ),
      ])
      .optional(),
    instructions: z.array(z.string()).optional(),
    layout: z.enum(["auto", "stretch"]).optional(),
    permission: z
      .union([
        z.enum(["ask", "allow", "deny"]),
        z.object({
          read: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          edit: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          glob: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          grep: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          list: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          bash: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          task: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          external_directory: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          todowrite: z.enum(["ask", "allow", "deny"]).optional(),
          question: z.enum(["ask", "allow", "deny"]).optional(),
          webfetch: z.enum(["ask", "allow", "deny"]).optional(),
          websearch: z.enum(["ask", "allow", "deny"]).optional(),
          repo_clone: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          repo_overview: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          lsp: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
          doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
          skill: z
            .union([
              z.enum(["ask", "allow", "deny"]),
              z.record(z.string(), z.enum(["ask", "allow", "deny"])),
            ])
            .optional(),
        }),
      ])
      .optional(),
    tools: z.record(z.string(), z.boolean()).optional(),
    attachment: z
      .object({
        image: z
          .object({
            auto_resize: z.boolean().optional(),
            max_width: z.number().optional(),
            max_height: z.number().optional(),
            max_base64_bytes: z.number().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    enterprise: z.object({ url: z.string().optional() }).strict().optional(),
    tool_output: z
      .object({
        max_lines: z.number().optional(),
        max_bytes: z.number().optional(),
      })
      .strict()
      .optional(),
    compaction: z
      .object({
        auto: z.boolean().optional(),
        prune: z.boolean().optional(),
        tail_turns: z.number().optional(),
        preserve_recent_tokens: z.number().optional(),
        reserved: z.number().optional(),
      })
      .strict()
      .optional(),
    experimental: z
      .object({
        disable_paste_summary: z.boolean().optional(),
        batch_tool: z.boolean().optional(),
        openTelemetry: z.boolean().optional(),
        primary_tools: z.array(z.string()).optional(),
        continue_loop_on_deny: z.boolean().optional(),
        mcp_timeout: z.number().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type OpencodeSchemaType = z.infer<typeof opencodeSchema>;
