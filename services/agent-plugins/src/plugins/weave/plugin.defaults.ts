import type { WeavePluginConfig } from "./plugin.config";

export const weavePluginDefaults = {
  ...({} as Required<WeavePluginConfig>),
  $schema: "/home/gustavo/Apps/opencode-weave/schema/weave-config.schema.json",
  logLevel: "INFO",
  tmuxEnabled: true,
  analyticsEnabled: true,
  analyticsUseFingerprint: true,
  continuationRecoveryCompaction: true,
  continuationIdleEnabled: true,
  continuationIdleWork: true,
  continuationIdleTodoPrompt: true,
  permissionQuestion: "allow",
  skillDirectories: [
    "~/.agents/skills",
    "~/.claude/skills",
    "~/.opencode/skills",
  ],
};
