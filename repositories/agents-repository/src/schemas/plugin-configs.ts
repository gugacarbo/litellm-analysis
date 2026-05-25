import { z } from "zod";
import {
  LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT,
  LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT,
  LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT,
  LITELLM_ALIAS_PREFIX_DEFAULT,
  LITELLM_ALIAS_SCHEMA_URL_DEFAULT,
  OPENAGENT_COMMIT_FOOTER_DEFAULT,
  OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT,
  OPENAGENT_SCHEMA_URL_DEFAULT,
  OPENCODE_DEFAULT_MODEL_DEFAULT,
  OPENCODE_DEFAULT_TEMPERATURE_DEFAULT,
  OPENCODE_SCHEMA_URL_DEFAULT,
  VSCODE_COMMIT_LANGUAGE_DEFAULT,
  VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT,
  VSCODE_RETRY_ENABLED_DEFAULT,
  VSCODE_SCHEMA_URL_DEFAULT,
  WEAVE_ANALYTICS_ENABLED_DEFAULT,
  WEAVE_ANALYTICS_USE_FINGERPRINT_DEFAULT,
  WEAVE_CONTINUATION_IDLE_ENABLED_DEFAULT,
  WEAVE_CONTINUATION_IDLE_TODO_PROMPT_DEFAULT,
  WEAVE_CONTINUATION_IDLE_WORK_DEFAULT,
  WEAVE_CONTINUATION_RECOVERY_COMPACTION_DEFAULT,
  WEAVE_LOG_LEVEL_DEFAULT,
  WEAVE_PERMISSION_QUESTION_DEFAULT,
  WEAVE_SCHEMA_URL_DEFAULT,
  WEAVE_SKILL_DIRECTORIES_DEFAULT,
  WEAVE_TMUX_ENABLED_DEFAULT,
} from "./plugin-defaults";

/** Configurable parameters for the OpenCode plugin. */
export const openCodePluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(OPENCODE_SCHEMA_URL_DEFAULT)
      .meta({
        title: "Schema URL",
        description: "Official OpenCode config schema URL",
      })
      .optional(),
    defaultModel: z
      .string()
      .default(OPENCODE_DEFAULT_MODEL_DEFAULT)
      .meta({
        title: "Default Model",
        description: "Model to use when a system agent has no model configured",
      })
      .optional(),
    defaultTemperature: z
      .number()
      .default(OPENCODE_DEFAULT_TEMPERATURE_DEFAULT)
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
      .default(OPENAGENT_SCHEMA_URL_DEFAULT)
      .meta({
        title: "Schema URL",
        description: "Official Oh My OpenAgent config schema URL",
      })
      .optional(),
    commitFooter: z
      .boolean()
      .default(OPENAGENT_COMMIT_FOOTER_DEFAULT)
      .meta({
        title: "Commit Footer",
        description: "Add footer to commit messages",
      })
      .optional(),
    includeCoAuthoredBy: z
      .boolean()
      .default(OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT)
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
      .default(VSCODE_SCHEMA_URL_DEFAULT)
      .meta({
        title: "Schema URL",
        description: "VS Code OAICopilot config schema URL",
      })
      .optional(),
    commitLanguage: z
      .string()
      .default(VSCODE_COMMIT_LANGUAGE_DEFAULT)
      .meta({
        title: "Commit Language",
        description: "Language for commit messages",
      })
      .optional(),
    retryEnabled: z
      .boolean()
      .default(VSCODE_RETRY_ENABLED_DEFAULT)
      .meta({ title: "Retry Enabled", description: "Enable retry on failure" })
      .optional(),
    maxRetryAttempts: z
      .number()
      .default(VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT)
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
      .default(LITELLM_ALIAS_SCHEMA_URL_DEFAULT)
      .meta({
        title: "Schema URL",
        description: "LiteLLM Router Aliases config schema URL",
      })
      .optional(),
    aliasPrefix: z
      .string()
      .default(LITELLM_ALIAS_PREFIX_DEFAULT)
      .meta({
        title: "Alias Prefix",
        description: "Text prepended to all generated alias names",
      })
      .optional(),
    includeAgents: z
      .boolean()
      .default(LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT)
      .meta({
        title: "Include Agents",
        description: "Include agent-based aliases in output",
      })
      .optional(),
    includeCategories: z
      .boolean()
      .default(LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT)
      .meta({
        title: "Include Categories",
        description: "Include category-based aliases in output",
      })
      .optional(),
    globalFallbackOverride: z
      .string()
      .default(LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT)
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
      .default(WEAVE_SCHEMA_URL_DEFAULT)
      .meta({
        title: "Schema URL",
        description: "OpenCode Weave config schema URL",
      })
      .optional(),
    logLevel: z
      .enum(["DEBUG", "INFO", "WARN", "ERROR"])
      .default(WEAVE_LOG_LEVEL_DEFAULT)
      .meta({
        title: "Log Level",
        description: "Logging verbosity level for Weave",
      })
      .optional(),
    tmuxEnabled: z
      .boolean()
      .default(WEAVE_TMUX_ENABLED_DEFAULT)
      .meta({
        title: "Tmux Enabled",
        description: "Enable tmux session management",
      })
      .optional(),
    analyticsEnabled: z
      .boolean()
      .default(WEAVE_ANALYTICS_ENABLED_DEFAULT)
      .meta({
        title: "Analytics Enabled",
        description: "Enable usage analytics collection",
      })
      .optional(),
    analyticsUseFingerprint: z
      .boolean()
      .default(WEAVE_ANALYTICS_USE_FINGERPRINT_DEFAULT)
      .meta({
        title: "Analytics Use Fingerprint",
        description: "Use fingerprint for analytics tracking",
      })
      .optional(),
    continuationRecoveryCompaction: z
      .boolean()
      .default(WEAVE_CONTINUATION_RECOVERY_COMPACTION_DEFAULT)
      .meta({
        title: "Continuation Recovery Compaction",
        description: "Enable context compaction during recovery",
      })
      .optional(),
    continuationIdleEnabled: z
      .boolean()
      .default(WEAVE_CONTINUATION_IDLE_ENABLED_DEFAULT)
      .meta({
        title: "Continuation Idle Enabled",
        description: "Enable idle continuation processing",
      })
      .optional(),
    continuationIdleWork: z
      .boolean()
      .default(WEAVE_CONTINUATION_IDLE_WORK_DEFAULT)
      .meta({
        title: "Continuation Idle Work",
        description: "Allow work during idle periods",
      })
      .optional(),
    continuationIdleTodoPrompt: z
      .boolean()
      .default(WEAVE_CONTINUATION_IDLE_TODO_PROMPT_DEFAULT)
      .meta({
        title: "Continuation Idle Todo Prompt",
        description: "Show todo prompt during idle",
      })
      .optional(),
    permissionQuestion: z
      .enum(["allow", "deny", "ask"])
      .default(WEAVE_PERMISSION_QUESTION_DEFAULT)
      .meta({
        title: "Permission Question Behavior",
        description: "Default behavior for permission questions",
      })
      .optional(),
    skillDirectories: z
      .array(z.string())
      .default([...WEAVE_SKILL_DIRECTORIES_DEFAULT])
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
