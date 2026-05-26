import { z } from "zod";

export const weavePluginConfigSchema = z
  .object({
    $schema: z
      .string()
      .default(
        "/home/gustavo/Apps/opencode-weave/schema/weave-config.schema.json",
      )
      .meta({
        title: "Schema URL",
        description: "OpenCode Weave config schema URL",
      }),
    logLevel: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).default("INFO").meta({
      title: "Log Level",
      description: "Logging verbosity level for Weave",
    }),
    tmuxEnabled: z.boolean().default(true).meta({
      title: "Tmux Enabled",
      description: "Enable tmux session management",
    }),
    analyticsEnabled: z.boolean().default(true).meta({
      title: "Analytics Enabled",
      description: "Enable usage analytics collection",
    }),
    analyticsUseFingerprint: z.boolean().default(true).meta({
      title: "Analytics Use Fingerprint",
      description: "Use fingerprint for analytics tracking",
    }),
    continuationRecoveryCompaction: z.boolean().default(true).meta({
      title: "Continuation Recovery Compaction",
      description: "Enable context compaction during recovery",
    }),
    continuationIdleEnabled: z.boolean().default(true).meta({
      title: "Continuation Idle Enabled",
      description: "Enable idle continuation processing",
    }),
    continuationIdleWork: z.boolean().default(true).meta({
      title: "Continuation Idle Work",
      description: "Allow work during idle periods",
    }),
    continuationIdleTodoPrompt: z.boolean().default(true).meta({
      title: "Continuation Idle Todo Prompt",
      description: "Show todo prompt during idle",
    }),
    permissionQuestion: z.enum(["allow", "deny", "ask"]).default("allow").meta({
      title: "Permission Question Behavior",
      description: "Default behavior for permission questions",
    }),
    skillDirectories: z
      .array(z.string())
      .default(["~/.agents/skills", "~/.claude/skills", "~/.opencode/skills"])
      .meta({
        title: "Skill Directories",
        description: "Directories to scan for skills",
      }),
  })
  .meta({
    title: "Weave Config",
    description: "OpenCode Weave plugin configuration",
  });

export type WeavePluginConfig = z.infer<typeof weavePluginConfigSchema> & {
  [key: string]: unknown;
};

export const weavePluginConfigJsonSchema = z.toJSONSchema(
  weavePluginConfigSchema,
);
