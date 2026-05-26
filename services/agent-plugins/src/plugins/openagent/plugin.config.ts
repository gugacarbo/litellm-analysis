import { z } from "zod";

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
      }),
    commitFooter: z.boolean().default(false).meta({
      title: "Commit Footer",
      description: "Add footer to commit messages",
    }),
    includeCoAuthoredBy: z.boolean().default(false).meta({
      title: "Include Co-Authored-By",
      description: "Include co-authored-by trailer in commits",
    }),
  })
  .meta({
    title: "OpenAgent Config",
    description: "Oh My OpenAgent plugin configuration",
  });

export type OpenAgentPluginConfig = z.infer<
  typeof openAgentPluginConfigSchema
> & { [key: string]: unknown };

export const openAgentPluginConfigJsonSchema = z.toJSONSchema(
  openAgentPluginConfigSchema,
);
