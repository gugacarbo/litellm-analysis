import { z } from "zod";

/** Configurable parameters for the OpenCode plugin. */
export const openCodePluginConfigSchema = z
  .object({
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
