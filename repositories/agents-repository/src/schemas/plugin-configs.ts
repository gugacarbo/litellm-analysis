import { z } from "zod";

/** Configurable parameters for the OpenCode plugin. */
export const openCodePluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default("https://opencode.ai/config.json")
      .meta({
        title: "Schema URL",
        description: "Official OpenCode config schema URL",
      })
      .optional(),
    defaultModel: z
      .string()
      .default("")
      .meta({
        title: "Default Model",
        description: "Model to use when a system agent has no model configured",
      })
      .optional(),
    defaultTemperature: z
      .number()
      .default(0.2)
      .meta({
        title: "Default Temperature",
        description:
          "Default sampling temperature for agents without one configured",
      })
      .optional(),
  })
  .meta({
    title: "OpenCode Config",
    description: "OpenCode AI SDK plugin configuration",
  });

export type OpenCodePluginConfig = z.infer<typeof openCodePluginConfigSchema>;

/** Configurable parameters for the OpenAgent plugin. */
export const openAgentPluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "Official Oh My OpenAgent config schema URL",
      })
      .optional(),
    commitFooter: z
      .boolean()
      .default(false)
      .meta({
        title: "Commit Footer",
        description: "Add footer to commit messages",
      })
      .optional(),
    includeCoAuthoredBy: z
      .boolean()
      .default(false)
      .meta({
        title: "Include Co-Authored-By",
        description: "Include co-authored-by trailer in commits",
      })
      .optional(),
  })
  .meta({
    title: "OpenAgent Config",
    description: "Oh My OpenAgent plugin configuration",
  });

export type OpenAgentPluginConfig = z.infer<typeof openAgentPluginConfigSchema>;

/** Configurable parameters for the VSCode plugin. */
export const vsCodePluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/vscode/schemas/vscode.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "VS Code OAICopilot config schema URL",
      })
      .optional(),
    commitLanguage: z
      .string()
      .default("Portuguese (Brazil)")
      .meta({
        title: "Commit Language",
        description: "Language for commit messages",
      })
      .optional(),
    retryEnabled: z
      .boolean()
      .default(true)
      .meta({ title: "Retry Enabled", description: "Enable retry on failure" })
      .optional(),
    maxRetryAttempts: z
      .number()
      .default(3)
      .meta({
        title: "Max Retry Attempts",
        description: "Maximum number of retry attempts",
      })
      .optional(),
  })
  .meta({
    title: "VSCode Config",
    description: "VS Code OAICopilot plugin configuration",
  });

export type VsCodePluginConfig = z.infer<typeof vsCodePluginConfigSchema>;

/** Configurable parameters for the LiteLLM Alias plugin. */
export const litellmAliasPluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "LiteLLM Router Aliases config schema URL",
      })
      .optional(),
    aliasPrefix: z
      .string()
      .default("")
      .meta({
        title: "Alias Prefix",
        description: "Text prepended to all generated alias names",
      })
      .optional(),
    includeAgents: z
      .boolean()
      .default(true)
      .meta({
        title: "Include Agents",
        description: "Include agent-based aliases in output",
      })
      .optional(),
    includeCategories: z
      .boolean()
      .default(true)
      .meta({
        title: "Include Categories",
        description: "Include category-based aliases in output",
      })
      .optional(),
    globalFallbackOverride: z
      .string()
      .default("")
      .meta({
        title: "Global Fallback Override",
        description: "Override global fallback model (empty = use default)",
      })
      .optional(),
  })
  .meta({
    title: "LiteLLM Alias Config",
    description: "LiteLLM Router Aliases plugin configuration",
  });

export type LitellmAliasPluginConfig = z.infer<
  typeof litellmAliasPluginConfigSchema
>;

/** Configurable parameters for the Weave plugin. */
export const weavePluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "https://raw.githubusercontent.com/pgermishuys/opencode-weave/refs/heads/main/schema/weave-config.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "OpenCode Weave config schema URL",
      })
      .optional(),
    logLevel: z
      .enum(["DEBUG", "INFO", "WARN", "ERROR"])
      .default("INFO")
      .meta({
        title: "Log Level",
        description: "Logging verbosity level for Weave",
      })
      .optional(),
    tmuxEnabled: z
      .boolean()
      .default(true)
      .meta({
        title: "Tmux Enabled",
        description: "Enable tmux session management",
      })
      .optional(),
    analyticsEnabled: z
      .boolean()
      .default(true)
      .meta({
        title: "Analytics Enabled",
        description: "Enable usage analytics collection",
      })
      .optional(),
    analyticsUseFingerprint: z
      .boolean()
      .default(true)
      .meta({
        title: "Analytics Use Fingerprint",
        description: "Use fingerprint for analytics tracking",
      })
      .optional(),
    continuationRecoveryCompaction: z
      .boolean()
      .default(true)
      .meta({
        title: "Continuation Recovery Compaction",
        description: "Enable context compaction during recovery",
      })
      .optional(),
    continuationIdleEnabled: z
      .boolean()
      .default(true)
      .meta({
        title: "Continuation Idle Enabled",
        description: "Enable idle continuation processing",
      })
      .optional(),
    continuationIdleWork: z
      .boolean()
      .default(true)
      .meta({
        title: "Continuation Idle Work",
        description: "Allow work during idle periods",
      })
      .optional(),
    continuationIdleTodoPrompt: z
      .boolean()
      .default(true)
      .meta({
        title: "Continuation Idle Todo Prompt",
        description: "Show todo prompt during idle",
      })
      .optional(),
    permissionQuestion: z
      .enum(["allow", "deny", "ask"])
      .default("allow")
      .meta({
        title: "Permission Question Behavior",
        description: "Default behavior for permission questions",
      })
      .optional(),
    skillDirectories: z
      .array(z.string())
      .default(["~/.agents/skills", "~/.claude/skills", "~/.opencode/skills"])
      .meta({
        title: "Skill Directories",
        description: "Directories to scan for skills",
      })
      .optional(),
  })
  .meta({
    title: "Weave Config",
    description: "OpenCode Weave plugin configuration",
  });

export type WeavePluginConfig = z.infer<typeof weavePluginConfigSchema>;

/** JSON Schema for the OpenCode plugin config. */
export const openCodePluginJsonSchema = z.toJSONSchema(
  openCodePluginConfigSchema,
);

/** JSON Schema for the OpenAgent plugin config. */
export const openAgentPluginJsonSchema = z.toJSONSchema(
  openAgentPluginConfigSchema,
);

/** JSON Schema for the VSCode plugin config. */
export const vsCodePluginJsonSchema = z.toJSONSchema(vsCodePluginConfigSchema);

/** JSON Schema for the LiteLLM Alias plugin config. */
export const litellmAliasPluginJsonSchema = z.toJSONSchema(
  litellmAliasPluginConfigSchema,
);

/** JSON Schema for the Weave plugin config. */
export const weavePluginJsonSchema = z.toJSONSchema(weavePluginConfigSchema);

/** Map of plugin ID to its JSON Schema for config validation. */
export const pluginConfigJsonSchemas: Record<
  string,
  Record<string, unknown>
> = {
  opencode: openCodePluginJsonSchema,
  openagent: openAgentPluginJsonSchema,
  vscode: vsCodePluginJsonSchema,
  "litellm-alias": litellmAliasPluginJsonSchema,
  weave: weavePluginJsonSchema,
};

/** Get the JSON Schema for a plugin's config by ID. */
export function getPluginConfigJsonSchema(
  pluginId: string,
): Record<string, unknown> | null {
  return pluginConfigJsonSchemas[pluginId] ?? null;
}
