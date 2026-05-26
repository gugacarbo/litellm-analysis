import { z } from "zod";
import { weaveManifest } from "./plugin.manifest";
import { type WeaveSchemaType, weaveSchema } from "./plugin.schema";

export const weavePluginConfigDefaults: WeaveSchemaType = weaveSchema.parse({
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

export type WeavePluginConfig = z.input<typeof weaveSchema>;

export const weavePluginConfigJsonSchema = z.toJSONSchema(weaveSchema);
