import { z } from "zod";
import { weaveManifest } from "./plugin.manifest";
import { weaveSchema } from "./plugin.schema";

export const weavePluginConfigSchema = weaveSchema.parse({
  $schema: weaveManifest.$schema,
  log_level: "INFO",
  tmux: { enabled: true },
  analytics: { enabled: true, use_fingerprint: true },
  continuation: {
    recovery: { compaction: true },
    idle: {
      enabled: true,
      work: true,
      workflow: true,
      todo_prompt: true,
    },
  },
  skill_directories: [
    "~/.agents/skills",
    "~/.claude/skills",
    "~/.opencode/skills",
  ],
});

export type WeavePluginConfig = z.infer<typeof weaveSchema> & {
  [key: string]: unknown;
};

export const weavePluginConfigJsonSchema = z.toJSONSchema(weaveSchema);
