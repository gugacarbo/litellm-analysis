import { z } from "zod";

const pluginSchemaBase = z.object({
  $schema: z.string().optional(),
});

const agentPermissionSchema = z
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
  .strict();

const agentModeSchema = z
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
    hidden: z.boolean().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
    color: z.string().optional(),
    permission: agentPermissionSchema.optional(),
  })
  .strict();

export const modelAliasPluginConfigSchema = pluginSchemaBase.extend({
  model_group_alias: z.record(z.string(), z.string()).default({}),
});

export const openAgentPluginConfigSchema = pluginSchemaBase.extend({
  disabled_mcps: z.array(z.string()).optional(),
  disabled_agents: z.array(z.string()).optional(),
  disabled_skills: z.array(z.string()).optional(),
  disabled_hooks: z.array(z.string()).optional(),
  disabled_commands: z.array(z.string()).optional(),
  agents: z.record(z.string(), agentModeSchema).optional(),
});

export const openCodePluginConfigSchema = pluginSchemaBase.extend({
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
          .object({
            repository: z.string(),
            branch: z.string().optional(),
          })
          .strict(),
        z
          .object({
            path: z.string(),
          })
          .strict(),
      ]),
    )
    .optional(),
  watcher: z
    .object({
      ignore: z.array(z.string()).optional(),
    })
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
  mode: z.record(z.string(), agentModeSchema).optional(),
  agent: z.record(z.string(), agentModeSchema).optional(),
});

export const vsCodePluginConfigSchema = pluginSchemaBase.extend({
  "oaicopilot.commitLanguage": z.string(),
  "oaicopilot.baseUrl": z.string(),
  "oaicopilot.delay": z.number(),
  "oaicopilot.readFileLines": z.number(),
  "oaicopilot.retry": z
    .object({
      enabled: z.boolean(),
      max_attempts: z.number(),
      interval_ms: z.number(),
      status_codes: z.array(z.number()),
    })
    .strict(),
  "oaicopilot.models": z.array(
    z
      .object({
        name: z.string(),
        id: z.string(),
        baseUrl: z.string(),
        "request-options": z
          .object({
            headers: z.record(z.string(), z.string()).optional(),
          })
          .optional(),
        "model-settings": z
          .object({
            "max-tokens": z.number().optional(),
          })
          .optional(),
        context_length: z.number().optional(),
        max_tokens: z.number().optional(),
        apiMode: z.string().optional(),
        reasoning_effort: z.string().optional(),
        enable_thinking: z.boolean().optional(),
        include_reasoning_in_request: z.boolean().optional(),
        vision: z.boolean().optional(),
        owned_by: z.string().optional(),
        displayName: z.string().optional(),
      })
      .strict(),
  ),
});

export const weavePluginConfigSchema = pluginSchemaBase.extend({
  agents: z.record(z.string(), agentModeSchema).optional(),
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
          fallback_models: z.array(z.string()).optional(),
          category: z
            .enum(["exploration", "specialist", "advisor", "utility"])
            .optional(),
          cost: z.enum(["FREE", "CHEAP", "EXPENSIVE"]).optional(),
          temperature: z.number().optional(),
          top_p: z.number().optional(),
          maxTokens: z.number().optional(),
          modelOptions: z.record(z.string(), z.unknown()).optional(),
          tools: z.record(z.string(), z.boolean()).optional(),
          skills: z.array(z.string()).optional(),
          triggers: z
            .array(
              z
                .object({
                  domain: z.string(),
                  trigger: z.string(),
                })
                .strict(),
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
          fallback_models: z.array(z.string()).optional(),
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
        .object({
          compaction: z.boolean().optional(),
        })
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
});

export type ModelAliasPluginConfig = z.infer<
  typeof modelAliasPluginConfigSchema
>;
export type OpenAgentPluginConfig = z.infer<typeof openAgentPluginConfigSchema>;
export type OpenCodePluginConfig = z.infer<typeof openCodePluginConfigSchema>;
export type VsCodePluginConfig = z.infer<typeof vsCodePluginConfigSchema>;
export type WeavePluginConfig = z.infer<typeof weavePluginConfigSchema>;

export const pluginConfigJsonSchemas: Record<
  string,
  Record<string, unknown>
> = {
  opencode: z.toJSONSchema(openCodePluginConfigSchema),
  openagent: z.toJSONSchema(openAgentPluginConfigSchema),
  vscode: z.toJSONSchema(vsCodePluginConfigSchema),
  "model-alias": z.toJSONSchema(modelAliasPluginConfigSchema),
  weave: z.toJSONSchema(weavePluginConfigSchema),
};

export function getPluginConfigJsonSchema(
  pluginId: string,
): Record<string, unknown> | null {
  return pluginConfigJsonSchemas[pluginId] ?? null;
}
